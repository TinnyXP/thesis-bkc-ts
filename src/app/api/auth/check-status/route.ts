// src/app/api/auth/check-status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ API key
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }
    
    // ดึง bkcId จาก query string
    const { searchParams } = new URL(request.url);
    const bkcId = searchParams.get('bkcId');
    
    if (!bkcId) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบ BKC ID" 
      }, { status: 400 });
    }
    
    await connectDB();
    
    // ตรวจสอบสถานะการใช้งานบัญชี
    const user = await User.findOne({ bkc_id: bkcId });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าบัญชีถูกระงับหรือไม่
    const blocked = user.is_active === false;
    
    return NextResponse.json({ 
      success: true, 
      blocked,
      isActive: user.is_active 
    });
    
  } catch (error) {
    console.error("Error checking account status:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะบัญชี",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}