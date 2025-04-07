// src/app/api/user/login-history/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import LoginHistory from "@/models/loginHistory";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

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
    
    // ตรวจสอบว่า ID ถูกต้องหรือไม่
    if (!session.user.id || session.user.id === "new-user" || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ 
        success: false, 
        message: "ผู้ใช้ยังไม่ได้ลงทะเบียนอย่างสมบูรณ์",
        history: []
      });
    }

    // เชื่อมต่อฐานข้อมูล
    await connectDB();

    // รับค่า query parameters จาก URL
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    // คำนวณ skip สำหรับการ pagination
    const skip = (page - 1) * limit;

    // ดึงประวัติการเข้าสู่ระบบ
    const loginHistory = await LoginHistory.find({ 
      user_id: session.user.id,
      login_status: "success" // เฉพาะการเข้าสู่ระบบที่สำเร็จ
    })
    .sort({ login_time: -1 }) // เรียงตามเวลาล่าสุด
    .skip(skip)
    .limit(limit);

    // นับจำนวนทั้งหมด (สำหรับทำ pagination)
    const total = await LoginHistory.countDocuments({ 
      user_id: session.user.id,
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
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}