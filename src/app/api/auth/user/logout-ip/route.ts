// src/app/api/user/logout-ip/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LoginHistory from "@/models/loginHistory";
import mongoose from "mongoose";

// กำหนดให้ API นี้เป็น dynamic function เพื่อใช้ headers ได้
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }

    const { ip_address, session_id } = await request.json();
    
    if (!ip_address) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาระบุ IP address" 
      }, { status: 400 });
    }

    // เชื่อมต่อฐานข้อมูล
    await connectDB();

    // สร้าง session_logout_date ให้กับ login history ที่มี ip_address นี้
    // เพื่อเป็นการทำเครื่องหมายว่า session นี้ถูก logout แล้ว
    const result = await LoginHistory.updateMany(
      { 
        user_id: new mongoose.Types.ObjectId(session.user.id),
        ip_address: ip_address, 
        session_id: session_id,
        session_logout_date: { $exists: false }
      },
      { 
        $set: { 
          session_logout_date: new Date(),
          logout_reason: 'user_request'
        } 
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: "ทำการออกจากระบบสำเร็จ",
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error("Error logging out IP:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการออกจากระบบ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}