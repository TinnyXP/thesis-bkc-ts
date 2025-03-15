import { Suspense } from "react";
import { WeatherClient } from "@/components";
import { AirQuality } from "@/types";

// กำหนดให้ revalidate ทุกๆ 30 วินาที
export const revalidate = 30;

/**
 * ฟังก์ชันดึงข้อมูลคุณภาพอากาศจาก API
 */
async function fetchAirQuality(): Promise<AirQuality> {
  try {
    // ตรวจสอบว่ามี API token หรือไม่
    if (!process.env.NEXT_PUBLIC_API_PM25) {
      console.error("ไม่พบ API token สำหรับข้อมูลคุณภาพอากาศ");
      return {
        pm25: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    // ดึงข้อมูลจาก API
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_PM25 as string,
      {
        next: { revalidate },
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${response.status}`);
    }

    const data = await response.json();

    // ตรวจสอบโครงสร้างข้อมูล
    if (!data.data || !data.data.iaqi || !data.data.iaqi.pm25) {
      throw new Error("ข้อมูลคุณภาพอากาศไม่อยู่ในรูปแบบที่ถูกต้อง");
    }

    return {
      pm25: data.data.iaqi.pm25.v,
      updatedAt: data.data.time.s,
    };
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลคุณภาพอากาศ:", error);
    
    // ส่งค่าเริ่มต้นเมื่อเกิดข้อผิดพลาด
    return {
      pm25: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * คอมโพเนนต์แสดงข้อมูลคุณภาพอากาศ (server-side)
 */
export default async function WeatherServer() {
  const airQuality = await fetchAirQuality();

  return (
    <Suspense fallback={<WeatherFallback />}>
      <WeatherClient airQuality={airQuality} />
    </Suspense>
  );
}

/**
 * คอมโพเนนต์แสดงในระหว่างที่กำลังโหลดข้อมูล
 */
function WeatherFallback() {
  return (
    <div className="min-w-screen flex flex-col items-center justify-center bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-300 p-10 rounded-lg animate-pulse">
      <div className="h-8 w-64 bg-gray-400 dark:bg-gray-600 rounded mb-4"></div>
      <div className="h-6 w-32 bg-gray-400 dark:bg-gray-600 rounded mb-4"></div>
      <div className="h-16 w-full max-w-md bg-gray-400 dark:bg-gray-600 rounded mb-4"></div>
      <div className="h-4 w-48 bg-gray-400 dark:bg-gray-600 rounded"></div>
    </div>
  );
}