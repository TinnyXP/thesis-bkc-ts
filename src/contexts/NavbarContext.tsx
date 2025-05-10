// src/contexts/NavbarContext.tsx
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useProfile, UserProfile } from '@/hooks/useProfile';

interface NavbarContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null; // เปลี่ยนจาก any เป็น Error | null
  refreshProfile: () => Promise<void>;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const profileData = useProfile();
  
  // ปรับปรุง dependency array ให้ถูกต้อง
  const contextValue = useMemo(() => ({
    profile: profileData.profile,
    isLoading: profileData.isLoading,
    error: profileData.error,
    refreshProfile: profileData.refreshProfile
  }), [
    profileData.profile,
    profileData.isLoading,
    profileData.error,
    profileData.refreshProfile
  ]);

  return (
    <NavbarContext.Provider value={contextValue}>
      {children}
    </NavbarContext.Provider>
  );
}

// Custom hook สำหรับการใช้งาน context
export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
}