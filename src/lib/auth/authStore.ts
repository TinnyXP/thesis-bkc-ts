// src/lib/auth/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from 'next-auth';
import { AuthState, UserProfile } from './types';

interface AuthStore {
    // สถานะ Authentication
    isAuthenticated: boolean;
    isLoading: boolean;
    authError: string | null;

    // ข้อมูลผู้ใช้
    user: UserProfile | null;
    session: Session | null;

    // สถานะการสร้างโปรไฟล์
    isNewUser: boolean;
    isCreatingProfile: boolean;
    isProfileComplete: boolean;

    // สถานะ OTP
    otpEmail: string | null;
    otpSent: boolean;
    otpExpiry: number | null;

    // ข้อมูล LINE
    isLineUser: boolean;
    originalLineData: {
        name: string;
        email: string;
        profileImage: string | null;
    } | null;
    useOriginalLineData: boolean;

    // สถานะ Auth State Machine
    authState: AuthState;

    // Actions
    setSession: (session: Session | null) => void;
    setUser: (user: UserProfile | null) => void;
    setAuthState: (state: AuthState) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    setIsNewUser: (isNewUser: boolean) => void;
    setAuthError: (error: string | null) => void;
    setIsLoading: (isLoading: boolean) => void;

    // OTP Actions
    setOtpEmail: (email: string) => void;
    setOtpSent: (sent: boolean, expiryInSeconds?: number) => void;
    clearOtpData: () => void;

    // LINE Actions
    setOriginalLineData: (data: { name: string; email: string; profileImage: string | null } | null) => void;
    setUseOriginalLineData: (use: boolean) => void;

    // Profile Actions
    setIsCreatingProfile: (isCreating: boolean) => void;
    setIsProfileComplete: (isComplete: boolean) => void;

    // Utility
    resetAuthStore: () => void;
}

// การตั้งค่าเริ่มต้น
const initialState = {
    isAuthenticated: false,
    isLoading: false,
    authError: null,
    user: null,
    session: null,
    isNewUser: false,
    isCreatingProfile: false,
    isProfileComplete: false,
    otpEmail: null,
    otpSent: false,
    otpExpiry: null,
    isLineUser: false,
    originalLineData: null,
    useOriginalLineData: false,
    authState: AuthState.UNAUTHENTICATED,
};

// สร้าง Zustand store ที่มีการ persist ข้อมูลสำคัญบางส่วนใน localStorage
export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            ...initialState,

            // Session และ User
            setSession: (session) => set({
                session,
                isAuthenticated: !!session,
                isNewUser: session?.user?.isNewUser || false,
            }),

            setUser: (user) => set({
                user,
                isLineUser: user?.provider === 'line',
                isProfileComplete: !!user
            }),

            // Auth State
            setAuthState: (authState) => set({ authState }),
            setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
            setIsNewUser: (isNewUser) => set({ isNewUser }),
            setAuthError: (authError) => set({ authError }),
            setIsLoading: (isLoading) => set({ isLoading }),

            // OTP
            setOtpEmail: (email) => set({ otpEmail: email }),
            setOtpSent: (sent, expiryInSeconds) => {
                if (sent && expiryInSeconds) {
                    const expiryTime = Date.now() + expiryInSeconds * 1000;
                    set({ otpSent: sent, otpExpiry: expiryTime });
                } else {
                    set({ otpSent: sent, otpExpiry: null });
                }
            },
            clearOtpData: () => set({ otpEmail: null, otpSent: false, otpExpiry: null }),

            // LINE
            setOriginalLineData: (data) => set({ originalLineData: data }),
            setUseOriginalLineData: (use) => set({ useOriginalLineData: use }),

            // Profile
            setIsCreatingProfile: (isCreating) => set({ isCreatingProfile: isCreating }),
            setIsProfileComplete: (isComplete) => set({ isProfileComplete: isComplete }),

            // Reset
            resetAuthStore: () => set({ ...initialState }),
        }),
        {
            name: 'auth-storage', // localStorage key
            partialize: (state) => ({
                // เก็บไว้เฉพาะข้อมูลที่จำเป็นสำหรับการคงสถานะระหว่างรีเฟรช
                otpEmail: state.otpEmail,
                otpSent: state.otpSent,
                otpExpiry: state.otpExpiry,
                useOriginalLineData: state.useOriginalLineData,
            }),
        }
    )
);

// Selectors
export const selectIsOtpValid = (state: AuthStore) => {
    if (!state.otpExpiry) return false;
    return Date.now() < state.otpExpiry;
};

export const selectOtpTimeRemaining = (state: AuthStore) => {
    if (!state.otpExpiry) return 0;
    const timeRemaining = Math.max(0, Math.floor((state.otpExpiry - Date.now()) / 1000));
    return timeRemaining;
};