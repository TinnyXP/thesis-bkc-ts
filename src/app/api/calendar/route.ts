// src/app/api/calendar/route.ts
import { NextResponse } from "next/server";

// Environment variables สำหรับ Google Calendar API
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY || "";
const CALENDAR_ID = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "";

export async function GET(request: Request) {
  // ดึงพารามิเตอร์ timeMin และ timeMax จาก URL
  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get('timeMin');
  const timeMax = searchParams.get('timeMax');

  if (!timeMin || !timeMax) {
    return NextResponse.json({ 
      success: false, 
      message: "ต้องระบุ timeMin และ timeMax" 
    }, { status: 400 });
  }

  try {
    // เรียกข้อมูลจาก Google Calendar API
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      events: data.items || []
    });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทิน",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}