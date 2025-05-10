// src/app/api/views/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PageView from "@/models/pageView";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { page_type, slug } = await request.json();
    
    if (!page_type || !slug) {
      return NextResponse.json({
        success: false,
        message: "Missing required parameters"
      }, { status: 400 });
    }

    // ดึง IP จาก request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(/, /)[0] : request.headers.get('x-real-ip') || '0.0.0.0';
    
    // สร้างวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD ตามเวลาไทย (UTC+7)
    const now = new Date();
    // ปรับเวลาเป็น UTC+7 (เวลาไทย)
    now.setHours(now.getHours() + 7);
    const today = now.toISOString().split('T')[0];
    
    await connectDB();
    
    // ค้นหาข้อมูลการเข้าชมของ IP นี้ในวันนี้
    const existingView = await PageView.findOne({
      page_type,
      slug,
      ip_address: ip,
      view_date: today
    });
    
    if (existingView) {
      // ถ้ามีการเข้าชมแล้วในวันนี้ ไม่ต้องเพิ่มจำนวนการเข้าชม
      // แค่ return success เฉยๆ
      return NextResponse.json({
        success: true,
        message: "Already tracked today"
      });
    } else {
      // ถ้ายังไม่มีการเข้าชมในวันนี้ ให้สร้างข้อมูลใหม่ โดยกำหนด view_count เป็น 1 เท่านั้น
      await PageView.create({
        page_type,
        slug,
        ip_address: ip,
        view_date: today,
        view_count: 1
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "View tracked successfully"
    });
    
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json({
      success: false,
      message: "Error tracking view"
    }, { status: 500 });
  }
}