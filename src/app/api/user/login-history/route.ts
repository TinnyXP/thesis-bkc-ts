// src/app/api/user/login-history/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import LoginHistory from "@/models/loginHistory";
import UserModel from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * ตรวจสอบว่า id เป็น LINE ID หรือไม่
 */
function isLineUserId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('U');
}

// กำหนดให้ API นี้เป็น dynamic function เพื่อใช้ headers ได้
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }
    
    console.log('Session user in login history:', {
      id: session.user.id,
      provider: session.user.provider
    });
    
    // เชื่อมต่อฐานข้อมูล
    await connectDB();
    
    // หาข้อมูลผู้ใช้จากฐานข้อมูล - ตรวจสอบตาม ID
    let user = null;
    if (session.user.id === 'new-user') {
      return NextResponse.json({ 
        success: true, 
        message: "ผู้ใช้ยังไม่ได้ลงทะเบียนอย่างสมบูรณ์",
        history: []
      });
    } else if (isLineUserId(session.user.id)) {
      // ถ้าเป็น LINE ID ให้ค้นหาด้วย provider_id แทน
      console.log('Searching user by LINE provider_id');
      user = await UserModel.findOne({ 
        provider: 'line',
        provider_id: session.user.id
      });
    } else if (mongoose.Types.ObjectId.isValid(session.user.id)) {
      // ถ้าเป็น ObjectId ปกติ
      console.log('Searching user by MongoDB ObjectId');
      user = await UserModel.findById(session.user.id);
    } else {
      // กรณีอื่นๆ ที่ไม่รองรับ
      return NextResponse.json({ 
        success: false, 
        message: "รูปแบบ ID ไม่ถูกต้อง",
        history: []
      });
    }

    if (!user) {
      console.log('User not found with ID:', session.user.id);
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้",
        history: []
      });
    }

    // รับค่า query parameters จาก URL
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    // คำนวณ skip สำหรับการ pagination
    const skip = (page - 1) * limit;

    // ดึงประวัติการเข้าสู่ระบบ - ใช้ _id จากผู้ใช้ที่ค้นหาได้
    const loginHistory = await LoginHistory.find({ 
      user_id: user._id,
      login_status: "success" // เฉพาะการเข้าสู่ระบบที่สำเร็จ
    })
    .sort({ login_time: -1 }) // เรียงตามเวลาล่าสุด
    .skip(skip)
    .limit(limit);

    // นับจำนวนทั้งหมด (สำหรับทำ pagination)
    const total = await LoginHistory.countDocuments({ 
      user_id: user._id,
      login_status: "success"
    });

    return NextResponse.json({ 
      success: true, 
      history: loginHistory,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการเข้าสู่ระบบ",
      error: error instanceof Error ? error.message : String(error),
      history: []
    }, { status: 500 });
  }
}