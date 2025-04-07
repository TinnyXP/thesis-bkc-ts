// src/app/api/user/get-profile/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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

export async function GET() {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }

    console.log('Session user in get profile:', {
      id: session.user.id,
      provider: session.user.provider
    });

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // หาข้อมูลผู้ใช้จากฐานข้อมูล - ตรวจสอบตาม ID
    let user = null;
    if (session.user.id === 'new-user') {
      return NextResponse.json({ 
        success: false, 
        message: "ต้องสร้างโปรไฟล์ให้เสร็จสมบูรณ์ก่อน" 
      }, { status: 400 });
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
        message: "รูปแบบ ID ไม่ถูกต้อง" 
      }, { status: 400 });
    }

    if (!user) {
      console.log('User not found with ID:', session.user.id);
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.profile_image,
        bio: user.bio || "",
        provider: user.provider
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}