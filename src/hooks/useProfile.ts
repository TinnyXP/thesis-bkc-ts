// src/hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  provider: string;
  bkcId: string;
  isActive: boolean;
  profileCompleted: boolean;
}

export function useProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // กำหนดให้ fetchProfile เป็น useCallback เพื่อให้สามารถใช้งานได้จากภายนอก
  const fetchProfile = useCallback(async () => {
    if (status === 'authenticated' && session) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setProfile(data.user);
        } else {
          setError(data.message || 'Failed to fetch profile');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    } else if (status === 'unauthenticated') {
      setProfile(null);
      setIsLoading(false);
    }
  }, [session, status]);

  // เรียกใช้ fetchProfile เมื่อ session หรือ status เปลี่ยน
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { 
    profile, 
    isLoading, 
    error, 
    refreshProfile: fetchProfile  // ส่ง function สำหรับ refresh ข้อมูลกลับไป
  };
}