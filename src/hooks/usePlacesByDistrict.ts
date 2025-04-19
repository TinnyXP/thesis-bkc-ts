// src/hooks/usePlacesByDistrict.ts
import useSWR from 'swr';
import { Place } from '@/lib/sanity/schema';

/**
 * Interface สำหรับผลลัพธ์ที่ได้จาก API
 */
interface PlacesResponse {
  success: boolean;
  places: Place[];
  message?: string;
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลจาก API
 * @param url URL ที่ต้องการดึงข้อมูล
 * @returns ข้อมูลจาก API ในรูปแบบ JSON
 */
const fetcher = (url: string): Promise<PlacesResponse> => 
  fetch(url).then(res => res.json());

/**
 * Hook สำหรับดึงข้อมูลสถานที่ท่องเที่ยวตามตำบล
 * 
 * @param district ชื่อตำบล
 * @returns {
 *   places: สถานที่ท่องเที่ยวในตำบลที่ระบุ,
 *   isLoading: สถานะการโหลดข้อมูล,
 *   isError: สถานะข้อผิดพลาด,
 *   mutate: ฟังก์ชันสำหรับรีเฟรชข้อมูล
 * }
 */
export function usePlacesByDistrict(district: string) {
  const { data, error, isLoading, mutate } = useSWR<PlacesResponse>(
    `/api/places/district/${district}`,
    fetcher, 
    {
      refreshInterval: 60000, // รีเฟรชทุก 60 วินาที
      revalidateOnFocus: true, // รีเฟรชเมื่อกลับมาที่แท็บ
      revalidateOnReconnect: true, // รีเฟรชเมื่อกลับมาออนไลน์
      dedupingInterval: 5000 // ป้องกันการเรียก API ซ้ำในช่วง 5 วินาที
    }
  );
  
  return {
    places: data?.places || [],
    isLoading,
    isError: error,
    mutate // ฟังก์ชันสำหรับรีเฟรชข้อมูลแบบทันที
  };
}