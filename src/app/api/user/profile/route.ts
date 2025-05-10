// src/app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ" 
      }, { status: 401 });
    }

    // ต้องการ bkc_id เป็นหลักเสมอ
    if (!session.user.bkcId) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่สามารถระบุตัวตนของผู้ใช้ได้" 
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาผู้ใช้ด้วย bkc_id
    const user = await UserModel.findOne({ bkc_id: session.user.bkcId });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบบัญชีผู้ใช้" 
      }, { status: 404 });
    }

    // ส่งข้อมูลโปรไฟล์กลับไป
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.profile_image,
        provider: user.provider,
        bkcId: user.bkc_id,
        isActive: user.is_active,
        profileCompleted: user.profile_completed
      }
    });
    
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}