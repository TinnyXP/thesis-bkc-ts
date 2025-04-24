// เพิ่มในไฟล์ src/app/api/auth/signout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้เข้าสู่ระบบ" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ตรวจสอบสถานะการใช้งานบัญชีล่าสุด
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    
    if (user && user.is_active === false) {
      // ถ้าบัญชีถูกระงับ ให้ redirect ไปยังหน้า login พร้อมแสดงข้อความแจ้งเตือน
      return NextResponse.json({ 
        success: true, 
        blocked: true,
        message: "บัญชีของคุณถูกระงับการใช้งาน" 
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: "ออกจากระบบสำเร็จ" 
    });
    
  } catch (error) {
    console.error("Error checking account status:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะบัญชี" 
    }, { status: 500 });
  }
}