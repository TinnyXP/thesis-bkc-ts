// src/hooks/useProfile.ts
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { showToast } from "@/lib/toast";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  provider: string;
  bkcId: string;
  isActive: boolean;
  profileCompleted: boolean;
  role?: 'user' | 'admin' | 'superadmin'; // เพิ่ม role ที่เป็นไปได้
}

const PROFILE_CACHE_KEY = 'user_profile_cache';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 นาที

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useProfile() {
  const { status } = useSession();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [cachedProfile, setCachedProfile] = useState<UserProfile | null>(null);
  
  // ดึงข้อมูลจาก cache ก่อนเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const { profile, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY_MS;
        
        if (!isExpired && profile) {
          setCachedProfile(profile);
        } else {
          // Clear expired cache
          localStorage.removeItem(PROFILE_CACHE_KEY);
        }
      }
      setIsInitialLoading(false);
    } catch (error) {
      console.error('Error reading from cache:', error);
      setIsInitialLoading(false);
    }
  }, []);
  
  // ใช้ SWR เพื่อดึงข้อมูลจากเซิร์ฟเวอร์
  const { data, error, isLoading: isSWRLoading, mutate } = useSWR(
    status === 'authenticated' ? '/api/user/profile' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 นาที (ลดลงจาก 10 นาทีเดิม เพื่อให้อัปเดตบ่อยขึ้น)
      onSuccess: (data) => {
        if (data?.success && data.user) {
          // บันทึกข้อมูลลง cache
          try {
            localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
              profile: data.user,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error('Error saving to cache:', e);
          }
        }
      }
    }
  );
  
  // ใช้ข้อมูลจาก cache ในช่วงที่กำลังโหลด
  const profile = isSWRLoading && cachedProfile ? cachedProfile : 
                  data?.success ? (data.user as UserProfile) : null;
  
  // รวม loading state จาก cache และ SWR
  const isLoading = isInitialLoading || (isSWRLoading && !cachedProfile);
  
  // ปรับปรุงฟังก์ชัน refreshProfile ให้ล้าง cache ก่อนดึงข้อมูลใหม่ และแสดง toast เมื่อเกิดข้อผิดพลาด
  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      // ล้าง cache ทุกครั้งเมื่อมีการรีเฟรช เพื่อให้แน่ใจว่าได้ข้อมูลล่าสุดเสมอ
      localStorage.removeItem(PROFILE_CACHE_KEY);
      
      // ตั้งค่า cachedProfile เป็น null เพื่อบังคับให้โหลดข้อมูลใหม่
      setCachedProfile(null);
      
      // อัปเดตข้อมูลจากเซิร์ฟเวอร์
      await mutate();
      return Promise.resolve();
    } catch (error) {
      console.error('Error refreshing profile:', error);
      showToast("ไม่สามารถรีเฟรชข้อมูลโปรไฟล์ได้", "error");
      return Promise.reject(error);
    }
  }, [mutate]);

  return { 
    profile,
    isLoading,
    error: error as Error | null,
    refreshProfile
  };
}