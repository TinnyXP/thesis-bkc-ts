// src/app/api/airquality/route.ts
import { NextResponse } from "next/server";

// กำหนดให้ route นี้เป็น dynamic เท่านั้น ไม่ต้อง generate ตอน build
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0; // ลบหรือแก้ไข revalidate เป็น 0

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
      }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      });
    }
    const apiUrl = `http://api.waqi.info/feed/${STATION_ID}/?token=${API_TOKEN}`;
    
    // เพิ่ม timeout และ signal สำหรับการเชื่อมต่อ
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    
    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Air quality API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.data) {
        return NextResponse.json({ 
          success: false, 
          message: "ไม่พบข้อมูลสภาพอากาศ" 
        }, { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, must-revalidate'
          }
        });
      }
      // เพิ่ม Cache-Control header
      return new NextResponse(JSON.stringify({
        success: true, 
        pm25: data.data.iaqi.pm25.v,
        updatedAt: data.data.time.s
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' // cache 10 นาที
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error("Error fetching air quality data:", error);
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