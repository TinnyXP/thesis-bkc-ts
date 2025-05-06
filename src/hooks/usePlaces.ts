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
 * Hook สำหรับดึงข้อมูลสถานที่ท่องเที่ยว
 * 
 * @param placeType ประเภทสถานที่ (optional)
 * @returns {
 *   places: สถานที่ท่องเที่ยว,
 *   isLoading: สถานะการโหลดข้อมูล,
 *   isError: สถานะข้อผิดพลาด,
 *   mutate: ฟังก์ชันสำหรับรีเฟรชข้อมูล
 * }
 */
export function usePlaces(placeType?: string) {
  const url = placeType 
    ? `/api/places/type/${placeType}` 
    : '/api/places';
  
  const { data, error, isLoading, mutate } = useSWR<PlacesResponse>(
    url, 
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000
    }
  );

  // เรียงลำดับสถานที่ตามวันที่อัปเดตล่าสุด
  const sortedPlaces: Place[] = data?.places
    ? [...data.places].sort((a, b) => {
        const dateA = new Date(a._updatedAt || a.publishedAt || '').getTime();
        const dateB = new Date(b._updatedAt || b.publishedAt || '').getTime();
        return dateB - dateA; // เรียงจากใหม่ไปเก่า
      })
    : [];

  return {
    places: sortedPlaces,
    isLoading,
    isError: error,
    mutate
  };
}