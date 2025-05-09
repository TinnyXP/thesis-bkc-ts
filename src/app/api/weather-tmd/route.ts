// src/app/api/weather-tmd/route.ts
import { NextResponse } from "next/server";

// สำคัญมาก: กำหนดให้ route นี้เป็น dynamic เท่านั้น ไม่ต้อง generate ตอน build
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ลบหรือแก้ไข revalidate เป็น 0 เพื่อไม่ให้มีการ cache ตอน build
export const revalidate = 0;

// TMD API token (ควรเก็บใน .env)
const TMD_API_TOKEN = process.env.TMD_API_TOKEN;

// API Headers
const headers = {
  accept: "application/json",
  authorization: `Bearer ${TMD_API_TOKEN}`
};

// พารามิเตอร์สำหรับพื้นที่บางกะเจ้า
const location = {
  province: "สมุทรปราการ",
  amphoe: "พระประแดง",
  tambon: "บางกะเจ้า"
};

// กำหนด interface สำหรับข้อมูลพยากรณ์อากาศ
interface TMDForecast {
  time: string;
  data: {
    tc?: number;
    tc_max?: number;
    tc_min?: number;
    rh?: number;
    rain?: number;
    ws10m?: number;
    wd10m?: number;
    cond?: string;
    tcc?: number;
    cla?: number;
    clm?: number;
    clh?: number;
    [key: string]: number | string | undefined;
  };
}

interface TMDResponse {
  WeatherForecasts?: Array<{
    location?: {
      name: string;
      latitude: number;
      longitude: number;
      [key: string]: string | number;
    };
    forecasts?: TMDForecast[];
  }>;
  [key: string]: unknown;
}

// ฟังก์ชันสำหรับเรียกข้อมูลพยากรณ์อากาศรายวัน
async function fetchDailyForecast(): Promise<TMDResponse> {
  const baseUrl = "https://data.tmd.go.th/nwpapi/v1/forecast/location/daily/place";
  const params = new URLSearchParams({
    province: location.province,
    amphoe: location.amphoe,
    tambon: location.tambon,
    fields: "tc_max,tc_min,rh,rain,cond", // เพิ่มฟิลด์ที่ต้องการ
    date: new Date().toISOString().split('T')[0], // วันที่ปัจจุบัน
    duration: "7", // พยากรณ์ล่วงหน้า 7 วัน
  });

  const url = `${baseUrl}?${params.toString()}`;
  
  // ตรวจสอบว่ามี API token หรือไม่
  if (!TMD_API_TOKEN) {
    throw new Error("TMD_API_TOKEN is missing. Cannot fetch weather data without valid token.");
  }
  
  // เพิ่ม timeout และ signal สำหรับการเชื่อมต่อ
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
  
  try {
    const response = await fetch(url, { 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`TMD API responded with status: ${response.status}`);
    }
    
    return await response.json() as TMDResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ฟังก์ชันสำหรับเรียกข้อมูลพยากรณ์อากาศรายชั่วโมง
async function fetchHourlyForecast(): Promise<TMDResponse> {
  const baseUrl = "https://data.tmd.go.th/nwpapi/v1/forecast/location/hourly/place";
  const currentDate = new Date();
  
  const params = new URLSearchParams({
    province: location.province,
    amphoe: location.amphoe,
    tambon: location.tambon,
    fields: "tc,rh,rain,ws10m,wd10m,cond", // เพิ่มฟิลด์ความเร็วลมและทิศทางลม
    date: currentDate.toISOString().split('T')[0],
    hour: currentDate.getHours().toString(),
    duration: "24", // พยากรณ์ล่วงหน้า 24 ชั่วโมง
  });

  const url = `${baseUrl}?${params.toString()}`;
  
  // ตรวจสอบว่ามี API token หรือไม่
  if (!TMD_API_TOKEN) {
    throw new Error("TMD_API_TOKEN is missing. Cannot fetch weather data without valid token.");
  }
  
  // เพิ่ม timeout และ signal สำหรับการเชื่อมต่อ
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
  
  try {
    const response = await fetch(url, { 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`TMD API responded with status: ${response.status}`);
    }
    
    return await response.json() as TMDResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// กำหนด interface สำหรับข้อมูลที่จะส่งกลับ
interface WeatherDataResponse {
  success: boolean;
  currentTime: string;
  location: {
    province: string;
    amphoe: string;
    tambon: string;
  };
  current: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    windDirection: number | null;
    rainForecast: number | null;
    condition: string | null;
  };
  today: {
    maxTemperature: number | null;
    minTemperature: number | null;
    humidity: number | null;
    rainForecast: number | null;
    condition: string | null;
  };
  daily: Array<{
    date: string;
    maxTemperature: number | null | undefined;
    minTemperature: number | null | undefined;
    humidity: number | null | undefined;
    rainForecast: number | null | undefined;
    condition: string | null | undefined;
  }>;
  hourly: Array<{
    time: string;
    temperature: number | null | undefined;
    humidity: number | null | undefined;
    windSpeed: number | null | undefined;
    windDirection: number | null | undefined;
    rainForecast: number | null | undefined;
    condition: string | null | undefined;
  }>;
}

// ฟังก์ชัน API route หลัก
export async function GET(): Promise<Response> {
  try {
    // เรียกข้อมูลพยากรณ์อากาศทั้งรายวันและรายชั่วโมงพร้อมกัน
    const [dailyData, hourlyData] = await Promise.all([
      fetchDailyForecast(),
      fetchHourlyForecast()
    ]);

    // วันที่และเวลาปัจจุบัน
    const currentTime = new Date().toISOString();

    // ข้อมูลพยากรณ์รายวัน
    const dailyForecasts = dailyData.WeatherForecasts?.[0]?.forecasts || [];
    
    // ข้อมูลพยากรณ์รายชั่วโมง
    const hourlyForecasts = hourlyData.WeatherForecasts?.[0]?.forecasts || [];

    // สร้างข้อมูลที่จะส่งกลับไป
    const weatherData: WeatherDataResponse = {
      success: true,
      currentTime,
      location: {
        province: location.province,
        amphoe: location.amphoe,
        tambon: location.tambon
      },
      current: {
        temperature: hourlyForecasts.length > 0 ? hourlyForecasts[0]?.data?.tc || null : null,
        humidity: hourlyForecasts.length > 0 ? hourlyForecasts[0]?.data?.rh || null : null,
        windSpeed: hourlyForecasts.length > 0 ? hourlyForecasts[0]?.data?.ws10m || null : null,
        windDirection: hourlyForecasts.length > 0 ? hourlyForecasts[0]?.data?.wd10m || null : null,
        rainForecast: hourlyForecasts.length > 0 ? hourlyForecasts[0]?.data?.rain || null : null,
        condition: hourlyForecasts.length > 0 ? hourlyForecasts[0]?.data?.cond || null : null,
      },
      today: {
        maxTemperature: dailyForecasts.length > 0 ? dailyForecasts[0]?.data?.tc_max || null : null,
        minTemperature: dailyForecasts.length > 0 ? dailyForecasts[0]?.data?.tc_min || null : null,
        humidity: dailyForecasts.length > 0 ? dailyForecasts[0]?.data?.rh || null : null,
        rainForecast: dailyForecasts.length > 0 ? dailyForecasts[0]?.data?.rain || null : null,
        condition: dailyForecasts.length > 0 ? dailyForecasts[0]?.data?.cond || null : null,
      },
      daily: dailyForecasts.map((forecast: TMDForecast) => ({
        date: forecast.time,
        maxTemperature: forecast.data?.tc_max,
        minTemperature: forecast.data?.tc_min,
        humidity: forecast.data?.rh,
        rainForecast: forecast.data?.rain,
        condition: forecast.data?.cond,
      })),
      hourly: hourlyForecasts.map((forecast: TMDForecast) => ({
        time: forecast.time,
        temperature: forecast.data?.tc,
        humidity: forecast.data?.rh, 
        windSpeed: forecast.data?.ws10m,
        windDirection: forecast.data?.wd10m,
        rainForecast: forecast.data?.rain,
        condition: forecast.data?.cond,
      }))
    };

    // เพิ่ม Cache-Control header
    return new NextResponse(JSON.stringify(weatherData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' // cache 10 นาที
      }
    });
  } catch (error) {
    // เมื่อมีข้อผิดพลาด จะส่งกลับข้อความแสดงความผิดพลาด
    console.error("Error fetching weather data:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสภาพอากาศ",
      error: error instanceof Error ? error.message : String(error)
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });
  }
}