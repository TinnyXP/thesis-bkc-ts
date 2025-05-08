// src/app/api/weather/route.ts
import { NextResponse } from "next/server";

export const revalidate = 30; // 30 seconds

export async function GET() {
  try {
    // ใช้ Environment Variables แทนการระบุค่าแบบ hardcode
    const API_TOKEN = process.env.AIR_QUALITY_API_TOKEN;
    const STATION_ID = process.env.AIR_QUALITY_STATION_ID || "A421915";
    
    if (!API_TOKEN) {
      console.error("AIR_QUALITY_API_TOKEN is not defined in environment variables");
      return NextResponse.json({ 
        success: false, 
        message: "ไม่สามารถเชื่อมต่อ API ได้ (ไม่พบ token)" 
      }, { status: 500 });
    }

    const apiUrl = `http://api.waqi.info/feed/${STATION_ID}/?token=${API_TOKEN}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.data) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลสภาพอากาศ" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true, 
      pm25: data.data.iaqi.pm25.v,
      updatedAt: data.data.time.s
    });
  } catch (error) {
    console.error("Error fetching air quality data:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสภาพอากาศ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}