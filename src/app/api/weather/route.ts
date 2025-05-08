// src/app/api/weather/route.ts
import { NextResponse } from "next/server";

export const revalidate = 30; // 30 seconds

export async function GET() {
  try {
    const response = await fetch("http://api.waqi.info/feed/A421915/?token=06605c96a372586b4da18f3e888e48e74ec192b1");
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