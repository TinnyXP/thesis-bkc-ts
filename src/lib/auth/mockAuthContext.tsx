"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock user data
interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string;
  provider: 'line' | 'otp';
  useOriginalLineData?: boolean;
  originalLineData?: {
    name: string;
    email: string;
    profileImage: string | null;
  };
}

// Mock login history item
interface LoginHistoryItem {
  id: string;
  sessionId: string;
  loginTime: Date;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string;
  location?: string;
  logoutDate?: Date;
  isCurrentSession: boolean;
  isCurrentIp?: boolean;
}

// Context type definition
interface MockAuthContextType {
  // Auth states
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Login methods
  loginWithEmail: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  loginWithLine: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile methods
  updateProfile: (data: {
    name: string;
    bio?: string;
    profileImage?: File | null;
  }) => Promise<{ success: boolean; error?: string }>;
  
  // LINE specific methods
  toggleLineData: (useOriginal: boolean) => Promise<void>;
  
  // Login history
  loginHistory: LoginHistoryItem[];
  logoutSession: (ipAddress: string, sessionId?: string) => Promise<void>;
}

// Create context
const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

// Default mock user
const defaultUser: UserProfile = {
  id: "user123",
  name: "บางกระเจ้า ผู้ใช้",
  email: "user@example.com",
  image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  bio: "นี่คือข้อมูลโปรไฟล์ตัวอย่าง สามารถแก้ไขได้ตามต้องการ เพื่อทดสอบระบบ UI",
  provider: 'otp'
};

// User with LINE provider
const lineUser: UserProfile = {
  id: "line456",
  name: "LINE ผู้ใช้",
  email: "line@example.com",
  image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  bio: "ผู้ใช้ที่เข้าสู่ระบบด้วย LINE",
  provider: 'line',
  useOriginalLineData: true,
  originalLineData: {
    name: "LINE Original",
    email: "line@example.com",
    profileImage: "https://profile.line-scdn.net/sample-image"
  }
};

// Mock login history
const mockLoginHistory: LoginHistoryItem[] = [
  {
    id: "hist1",
    sessionId: "sess1",
    loginTime: new Date(Date.now() - 3600000), // 1 hour ago
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    isCurrentSession: true,
    isCurrentIp: true
  },
  {
    id: "hist2",
    sessionId: "sess2",
    loginTime: new Date(Date.now() - 86400000), // 1 day ago
    ipAddress: "192.168.1.2",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    isCurrentSession: false,
    isCurrentIp: false
  },
  {
    id: "hist3",
    sessionId: "sess3",
    loginTime: new Date(Date.now() - 172800000), // 2 days ago
    ipAddress: "192.168.1.3",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
    isCurrentSession: false,
    isCurrentIp: false,
    logoutDate: new Date(Date.now() - 86400000) // 1 day ago
  }
];

// Provider component
export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>(mockLoginHistory);
  const [emailForOtp, setEmailForOtp] = useState<string>('');

  // Check localStorage for persistence on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('mockAuth');
    if (storedAuth) {
      try {
        const { isAuthenticated, user } = JSON.parse(storedAuth);
        setIsAuthenticated(isAuthenticated);
        setUser(user);
      } catch (err) {
        console.error('Error parsing stored auth data', err);
      }
    }
  }, []);

  // Simulate email login flow (send OTP)
  const loginWithEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store email for OTP verification step
      setEmailForOtp(email);
      
      // Success: return to show OTP input UI
      return Promise.resolve();
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการส่ง OTP');
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate OTP verification
  const verifyOtp = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Any 6-digit OTP is valid in mock system
      if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        throw new Error('รหัส OTP ไม่ถูกต้อง');
      }
      
      // Set authenticated with default user
      const authUser = {
        ...defaultUser,
        email: emailForOtp || defaultUser.email
      };
      
      setIsAuthenticated(true);
      setUser(authUser);
      
      // Store in localStorage
      localStorage.setItem('mockAuth', JSON.stringify({
        isAuthenticated: true,
        user: authUser
      }));
      
      return Promise.resolve();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'การยืนยัน OTP ล้มเหลว');
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate LINE login
  const loginWithLine = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Set authenticated with LINE user
      setIsAuthenticated(true);
      setUser(lineUser);
      
      // Store in localStorage
      localStorage.setItem('mockAuth', JSON.stringify({
        isAuthenticated: true,
        user: lineUser
      }));
      
      return Promise.resolve();
    } catch (err) {
      setError('การเข้าสู่ระบบด้วย LINE ล้มเหลว');
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Clear auth state
      setIsAuthenticated(false);
      setUser(null);
      
      // Remove from localStorage
      localStorage.removeItem('mockAuth');
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error during logout', err);
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (data: {
    name: string;
    bio?: string;
    profileImage?: File | null;
  }) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!user) {
        throw new Error('ไม่พบข้อมูลผู้ใช้');
      }
      
      // Create updated user
      const updatedUser = {
        ...user,
        name: data.name,
        bio: data.bio || user.bio,
        // Only update image if provided (mock scenario - in real app would upload)
        image: data.profileImage ? URL.createObjectURL(data.profileImage) : user.image
      };
      
      // Update state
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('mockAuth', JSON.stringify({
        isAuthenticated: true,
        user: updatedUser
      }));
      
      return { success: true };
    } catch (err) {
      console.error('Error updating profile', err);
      const errorMsg = err instanceof Error ? err.message : 'การอัพเดทโปรไฟล์ล้มเหลว';
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle using LINE original data
  const toggleLineData = async (useOriginal: boolean) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!user || user.provider !== 'line' || !user.originalLineData) {
        throw new Error('ไม่สามารถใช้งานฟีเจอร์นี้ได้');
      }
      
      const updatedUser = {
        ...user,
        useOriginalLineData: useOriginal,
        name: useOriginal ? user.originalLineData.name : user.name,
        image: useOriginal ? user.originalLineData.profileImage : user.image
      };
      
      // Update state
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('mockAuth', JSON.stringify({
        isAuthenticated: true,
        user: updatedUser
      }));
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error toggling LINE data', err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนข้อมูล LINE ได้');
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Log out from another session
  const logoutSession = async (ipAddress: string, sessionId?: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update login history to mark the session as logged out
      const updatedHistory = loginHistory.map(item => {
        if (item.ipAddress === ipAddress && (!sessionId || item.sessionId === sessionId)) {
          return {
            ...item,
            isCurrentSession: false,
            logoutDate: new Date()
          };
        }
        return item;
      });
      
      setLoginHistory(updatedHistory);
      return Promise.resolve();
    } catch (err) {
      console.error('Error during session logout', err);
      setError('ไม่สามารถออกจากระบบได้');
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Provide context value
  const contextValue: MockAuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    error,
    loginWithEmail,
    verifyOtp,
    loginWithLine,
    logout,
    updateProfile,
    toggleLineData,
    loginHistory,
    logoutSession
  };

  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}