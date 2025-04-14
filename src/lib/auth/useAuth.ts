// src/lib/auth/useAuth.ts
import { useCallback, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useAuthStore, selectIsOtpValid, selectOtpTimeRemaining } from './authStore';
import { useInterpret, useSelector } from '@xstate/react';
import { UserProfile, AuthState } from './types';
import { authMachine } from './authStateMachine';
import { UserRepository } from '@/lib/repositories/userRepository';
import { LoginHistoryRepository } from '@/lib/repositories/loginHistoryRepository';
import { useRouter } from 'next/navigation';

/**
 * Custom hook สำหรับจัดการการเข้าสู่ระบบและการตรวจสอบตัวตน
 */
export const useAuth = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  // สร้าง Repository instances
  const userRepositoryRef = useRef(new UserRepository());
  const loginHistoryRepositoryRef = useRef(new LoginHistoryRepository());
  
  // เข้าถึง auth store
  const authStore = useAuthStore();
  const {
    isAuthenticated,
    isNewUser,
    user,
    otpEmail,
    otpSent,
    authError,
    isLoading: isStoreLoading,
    isLineUser,
    useOriginalLineData,
    originalLineData,
    authState: currentAuthState
  } = authStore;
  
  // สร้างและใช้งาน State Machine
  const authService = useInterpret(authMachine);
  
  // Selectors สำหรับ OTP
  const isOtpValid = useAuthStore(selectIsOtpValid);
  const otpTimeRemaining = useAuthStore(selectOtpTimeRemaining);
  
  // ดึงข้อมูลผู้ใช้จาก API
  const fetchUserProfile = useCallback(async () => {
    if (!session?.user?.id || session.user.id === 'new-user') return null;
    
    try {
      authStore.setIsLoading(true);
      
      const response = await fetch('/api/user/get-profile', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`Error fetching profile: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        authStore.setUser(data.user);
        return data.user;
      } else {
        throw new Error(data.message || 'Could not fetch user profile');
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to fetch profile');
      return null;
    } finally {
      authStore.setIsLoading(false);
    }
  }, [session, authStore]);
  
  // สร้างโปรไฟล์ใหม่
  const createProfile = useCallback(async (profileData: {
    name: string;
    bio?: string;
    profileImage?: File | null;
  }) => {
    try {
      authStore.setIsLoading(true);
      
      const formData = new FormData();
      formData.append("name", profileData.name);
      formData.append("bio", profileData.bio || "");
      
      if (profileData.profileImage) {
        formData.append("profileImage", profileData.profileImage);
      }
      
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: Could not create profile`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // อัพเดท Zustand store
        authStore.setUser(data.user);
        authStore.setIsNewUser(false);
        
        // อัพเดท NextAuth session
        await update({
          ...session,
          user: {
            ...session?.user,
            id: data.user.id,
            isNewUser: false,
            name: data.user.name,
            image: data.user.image
          }
        });
        
        // ส่ง event ไปยัง state machine
        authService.send({ type: 'PROFILE_CREATED', user: data.user });
        
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || "Could not create profile");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to create profile');
      
      // ส่ง error event ไปยัง state machine
      authService.send({ type: 'ERROR', message: error instanceof Error ? error.message : 'Failed to create profile' });
      
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create profile' };
    } finally {
      authStore.setIsLoading(false);
    }
  }, [authStore, session, update, authService]);
  
  // ส่ง OTP
  const sendOtp = useCallback(async (email: string) => {
    try {
      authStore.setIsLoading(true);
      authStore.setOtpEmail(email);
      
      // ส่ง event ไปยัง state machine
      authService.send({ type: 'LOGIN_OTP', email });
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // ตั้งค่า OTP ใน Zustand store
        authStore.setOtpSent(true, 60); // 60 seconds timeout
        
        // ส่ง event ไปยัง state machine
        authService.send({ type: 'OTP_SENT', email });
        
        return { success: true };
      } else {
        throw new Error(data.message || "Could not send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to send OTP');
      
      // ส่ง error event ไปยัง state machine
      authService.send({ type: 'ERROR', message: error instanceof Error ? error.message : 'Failed to send OTP' });
      
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send OTP' };
    } finally {
      authStore.setIsLoading(false);
    }
  }, [authStore, authService]);
  
  // ยืนยัน OTP
  const verifyOtp = useCallback(async (email: string, otp: string) => {
    try {
      authStore.setIsLoading(true);
      
      // ส่ง event ไปยัง state machine
      authService.send({ type: 'VERIFY_OTP', otp });
      
      const result = await signIn("otp", {
        email,
        otp,
        redirect: false,
        callbackUrl: '/'
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      if (result?.ok) {
        // ล้างข้อมูล OTP เมื่อเข้าสู่ระบบสำเร็จ
        authStore.clearOtpData();
        
        // ดึงข้อมูลผู้ใช้และอัพเดท store
        const user = await fetchUserProfile();
        
        // ส่ง event ไปยัง state machine
        authService.send({ 
          type: 'OTP_VERIFIED', 
          user,
          isNewUser: !!session?.user?.isNewUser
        });
        
        // ถ้าเป็นผู้ใช้ใหม่ ให้ไปที่หน้าสร้างโปรไฟล์
        if (session?.user?.isNewUser) {
          router.replace('/create-profile');
        } else {
          router.replace('/');
        }
        
        return { success: true };
      } else {
        throw new Error("OTP verification failed");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to verify OTP');
      
      // ส่ง error event ไปยัง state machine
      authService.send({ type: 'ERROR', message: error instanceof Error ? error.message : 'Failed to verify OTP' });
      
      return { success: false, error: error instanceof Error ? error.message : 'Failed to verify OTP' };
    } finally {
      authStore.setIsLoading(false);
    }
  }, [authStore, authService, fetchUserProfile, session, router]);
  
  // เข้าสู่ระบบด้วย LINE
  const loginWithLine = useCallback(() => {
    // ส่ง event ไปยัง state machine
    authService.send({ type: 'LOGIN_LINE' });
    
    // เริ่มการเข้าสู่ระบบด้วย LINE
    signIn("line", { callbackUrl: "/" });
  }, [authService]);
  
  // ออกจากระบบ
  const logout = useCallback(async () => {
    try {
      // ล้างข้อมูลใน auth store
      authStore.resetAuthStore();
      
      // ส่ง event ไปยัง state machine
      authService.send({ type: 'LOGOUT' });
      
      // ออกจากระบบด้วย NextAuth
      await signOut({ callbackUrl: '/login' });
      
      return { success: true };
    } catch (error) {
      console.error("Error during logout:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' };
    }
  }, [authStore, authService]);
  
  // อัพเดทการใช้ข้อมูล LINE
  const updateLineDataUsage = useCallback(async (useOriginalData: boolean) => {
    try {
      authStore.setIsLoading(true);
      
      const response = await fetch('/api/user/use-line-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          use_original_data: useOriginalData
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error updating LINE data usage: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // อัพเดทข้อมูลใน store
        authStore.setUser(data.user);
        authStore.setUseOriginalLineData(useOriginalData);
        
        // อัพเดท session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            image: data.user.image
          }
        });
        
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || "Could not update LINE data usage");
      }
    } catch (error) {
      console.error("Error updating LINE data usage:", error);
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to update LINE data usage');
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update LINE data usage' };
    } finally {
      authStore.setIsLoading(false);
    }
  }, [authStore, session, update]);
  
  // อัพเดทข้อมูลผู้ใช้
  const updateProfile = useCallback(async (profileData: {
    name: string;
    bio?: string;
    profileImage?: File | null;
    removeCurrentImage?: boolean;
  }) => {
    try {
      authStore.setIsLoading(true);
      
      const formData = new FormData();
      formData.append("name", profileData.name);
      formData.append("bio", profileData.bio || "");
      formData.append("use_original_data", String(authStore.useOriginalLineData));
      
      // จัดการกับรูปโปรไฟล์
      if (profileData.profileImage) {
        // อัพโหลดรูปใหม่
        formData.append("profileImage", profileData.profileImage);
      } else if (profileData.removeCurrentImage) {
        // ลบรูปปัจจุบัน
        formData.append("profileImage", "null");
      }
      
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error updating profile: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // อัพเดทข้อมูลใน store
        authStore.setUser(data.user);
        
        // อัพเดท session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            image: data.user.image
          }
        });
        
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || "Could not update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to update profile');
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
    } finally {
      authStore.setIsLoading(false);
    }
  }, [authStore, session, update]);
  
  // ตรวจสอบและอัพเดทสถานะเมื่อ session หรือ status เปลี่ยนแปลง
  useEffect(() => {
    // ส่ง CHECK_SESSION event ไปยัง state machine
    authService.send({ type: 'CHECK_SESSION' });
    
    if (status === 'loading') {
      authStore.setIsLoading(true);
      authStore.setAuthState(AuthState.LOADING);
    } else if (status === 'authenticated' && session) {
      authStore.setSession(session);
      authStore.setIsAuthenticated(true);
      authStore.setIsNewUser(!!session.user.isNewUser);
      authStore.setAuthState(AuthState.AUTHENTICATED);
      
      // ส่ง SESSION_FOUND event ไปยัง state machine
      authService.send({ type: 'SESSION_FOUND', session });
      
      // ถ้ามี session แต่ยังไม่มีข้อมูลผู้ใช้ใน store ให้ดึงข้อมูลผู้ใช้
      if (!authStore.user) {
        fetchUserProfile();
      }
    } else {
      authStore.setSession(null);
      authStore.setIsAuthenticated(false);
      authStore.setAuthState(AuthState.UNAUTHENTICATED);
      
      // ส่ง NO_SESSION event ไปยัง state machine
      authService.send({ type: 'NO_SESSION' });
    }
  }, [session, status, authStore, authService, fetchUserProfile]);
  
  return {
    // สถานะ
    isAuthenticated,
    isNewUser,
    isLoading: isStoreLoading || status === 'loading',
    authError,
    user,
    session,
    
    // สถานะ OTP
    otpEmail,
    otpSent,
    isOtpValid,
    otpTimeRemaining,
    
    // ข้อมูล LINE
    isLineUser,
    useOriginalLineData,
    originalLineData,
    
    // สถานะ Auth State Machine
    authState: currentAuthState,
    
    // Actions
    login: {
      withOtp: {
        sendOtp,
        verifyOtp
      },
      withLine: loginWithLine
    },
    logout,
    createProfile,
    updateProfile,
    updateLineDataUsage,
    fetchUserProfile,
    
    // ตัวอ้างอิงไปยัง State Machine service
    authService
  };
};