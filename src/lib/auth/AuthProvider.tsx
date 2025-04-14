"use client";

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// สร้าง Query Client สำหรับ React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * ใช้ Provider Pattern เพื่อจัดการสถานะการ Authentication แบบรวมศูนย์
 * โดยรวม SessionProvider ของ NextAuth และ QueryClientProvider ของ React Query
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </SessionProvider>
  );
}

/**
 * อีกทางเลือกคือสร้าง custom context provider สำหรับ auth state
 * เพื่อให้สามารถเข้าถึงสถานะ auth ได้ง่ายยิ่งขึ้น
 */
/*
import { createContext, useContext } from 'react';
import { useAuth } from './useAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  isNewUser: boolean;
  user: any;
  authError: string | null;
  isLoading: boolean;
  // ...other auth state and methods
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthContextProvider({ children }: { children: ReactNode }) {
  // ใช้ custom hook ที่เราสร้างไว้
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook สำหรับใช้ context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthContextProvider');
  }
  return context;
}

// ใช้ Provider ที่รวมทุกอย่างเข้าด้วยกัน
export function AppAuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
          {children}
        </AuthContextProvider>
        {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </SessionProvider>
  );
}
*/