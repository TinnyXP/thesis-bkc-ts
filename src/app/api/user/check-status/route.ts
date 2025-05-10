// src/app/api/user/check-status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        isActive: false,
        isLoggedIn: false,
        message: "ไม่ได้เข้าสู่ระบบ" 
      }, { status: 401 });
    }

    // ต้องการ bkc_id เป็นหลักเสมอ
    if (!session.user.bkcId) {
      return NextResponse.json({ 
        success: false,
        isActive: false,
        isLoggedIn: true,
        message: "ไม่สามารถระบุตัวตนของผู้ใช้ได้" 
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาผู้ใช้ด้วย bkc_id
    const user = await User.findOne({ bkc_id: session.user.bkcId });

    if (!user) {
      return NextResponse.json({ 
        success: false,
        isActive: false,
        isLoggedIn: true,
        message: "ไม่พบบัญชีผู้ใช้" 
      }, { status: 404 });
    }

    // ตรวจสอบว่าบัญชียังเปิดใช้งานอยู่หรือไม่
    if (!user.is_active) {
      return NextResponse.json({ 
        success: false,
        isActive: false,
        isLoggedIn: true,
        message: "บัญชีนี้ถูกระงับการใช้งาน โปรดติดต่อผู้ดูแลระบบ" 
      });
    }

    // ส่งข้อมูลสถานะบัญชีกลับไป
    return NextResponse.json({ 
      success: true,
      isActive: true,
      isLoggedIn: true
    });
    
  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json({ 
      success: false, 
      isActive: true, // สมมติว่ายังใช้งานได้ เพื่อไม่ให้ล็อกเอาท์โดยไม่จำเป็น
      isLoggedIn: true,
      message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะบัญชี",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}