// src/app/(tab)/community/route.ts
import { NextRequest, NextResponse } from "next/server";

// ฟังก์ชันสำหรับจัดการการเปลี่ยนเส้นทาง
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.nextUrl);
  const tab = searchParams.get('tab');
  
  // ถ้ามีการระบุแท็บให้เปลี่ยนเส้นทางไปที่หน้า Community พร้อมแท็บที่ถูกต้อง
  if (tab === 'forum' || tab === 'complaints') {
    return NextResponse.redirect(new URL(`/community?tab=${tab}`, request.url));
  }
  
  // ถ้าไม่มีการระบุแท็บให้ใช้แท็บ forum เป็นค่าเริ่มต้น
  if (!tab) {
    return NextResponse.redirect(new URL('/community?tab=forum', request.url));
  }
  
  // ถ้ามีการระบุแท็บที่ไม่ถูกต้อง ให้ใช้แท็บ forum เป็นค่าเริ่มต้น
  if (tab !== 'forum' && tab !== 'complaints') {
    return NextResponse.redirect(new URL('/community?tab=forum', request.url));
  }
  
  // ถ้าไม่มีการเปลี่ยนแปลงเส้นทาง ให้แสดงหน้าตามปกติ
  return NextResponse.next();
}