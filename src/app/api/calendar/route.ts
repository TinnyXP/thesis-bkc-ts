// src/app/api/calendar/route.ts (ปรับปรุง)
import { NextResponse } from "next/server";

// Environment variables สำหรับ Google Calendar API
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY || "";
const CALENDAR_ID = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "";
const THAI_HOLIDAY_CALENDAR_ID = "th.th%23holiday%40group.v.calendar.google.com"; // Calendar ID สำหรับวันหยุดไทย

// กำหนด interface สำหรับ Google Calendar Event
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  eventType?: string;
  [key: string]: unknown;
}

// กำหนด interface สำหรับ Google Calendar API Response
interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[];
  [key: string]: unknown;
}

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
    // เรียกข้อมูลจาก Google Calendar API ทั้งปฏิทินกิจกรรมและวันหยุดไทยพร้อมกัน
    const [eventsResponse, holidaysResponse] = await Promise.all([
      // เรียกข้อมูลกิจกรรมจากปฏิทินหลัก
      fetch(`https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`),
      // เรียกข้อมูลวันหยุดจากปฏิทินวันหยุดไทย
      fetch(`https://www.googleapis.com/calendar/v3/calendars/${THAI_HOLIDAY_CALENDAR_ID}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`)
    ]);

    if (!eventsResponse.ok) {
      throw new Error(`Events API responded with status: ${eventsResponse.status}`);
    }

    if (!holidaysResponse.ok) {
      console.warn(`Holidays API responded with status: ${holidaysResponse.status}`);
      // ถ้าไม่สามารถดึงข้อมูลวันหยุดได้ ให้ดำเนินการต่อด้วยเฉพาะข้อมูลกิจกรรม
    }
    
    // แปลงข้อมูลกิจกรรมและวันหยุดเป็น JSON
    const eventsData: GoogleCalendarResponse = await eventsResponse.json();
    const holidaysData: GoogleCalendarResponse = holidaysResponse.ok ? await holidaysResponse.json() : { items: [] };
    
    // เพิ่มประเภทให้กับกิจกรรม: กิจกรรมปกติ vs วันหยุด
    const events = eventsData.items?.map((event: GoogleCalendarEvent) => ({
      ...event,
      eventType: event.eventType || "กิจกรรมชุมชน" // ถ้าไม่มี eventType ให้เป็น "กิจกรรมชุมชน"
    })) || [];
    
    // เพิ่มข้อมูลประเภทให้กับวันหยุด
    const holidays = holidaysData.items?.map((holiday: GoogleCalendarEvent) => ({
      ...holiday,
      eventType: "วันหยุดราชการ" // กำหนดให้เป็น "วันหยุดราชการ" สำหรับทุกวันหยุด
    })) || [];
    
    // รวมข้อมูลกิจกรรมและวันหยุดเข้าด้วยกัน
    const allEvents = [...events, ...holidays];
    
    return NextResponse.json({
      success: true,
      events: allEvents || []
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