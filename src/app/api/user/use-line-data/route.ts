// src/app/api/user/use-line-data/route.ts
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

    // รับข้อมูลจากคำขอ
    const data = await request.json();
    const useOriginalData = !!data.use_original_data;

    console.log('Session user in use-line-data:', {
      id: session.user.id,
      provider: session.user.provider
    });

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // หาข้อมูลผู้ใช้จากฐานข้อมูล
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

    // ตรวจสอบว่าพบผู้ใช้หรือไม่
    if (!user) {
      console.log('User not found with ID:', session.user.id);
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }

    // ตรวจสอบว่าเป็นผู้ใช้ LINE หรือไม่
    if (user.provider !== 'line' || !user.original_line_data) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่สามารถใช้ข้อมูลจาก LINE ได้ เนื่องจากไม่ได้เข้าสู่ระบบด้วย LINE" 
      }, { status: 400 });
    }

    // อัพเดทสถานะการใช้ข้อมูลจาก LINE
    interface UpdateData {
      use_original_data: boolean;
      name?: string;
      profile_image?: string;
    }
    
    const updateData: UpdateData = {
      use_original_data: useOriginalData
    };

    // ถ้าเลือกใช้ข้อมูลจาก LINE ให้อัพเดทข้อมูลหลักด้วยข้อมูลจาก LINE
    if (useOriginalData && user.original_line_data) {
      updateData.name = user.original_line_data.name;
      updateData.profile_image = user.original_line_data.profile_image;
    }

    // อัพเดทข้อมูลผู้ใช้
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true } // คืนค่าข้อมูลหลังอัพเดท
    );

    // กำหนด interface สำหรับข้อมูลผู้ใช้ที่จะส่งกลับ
    interface UserResponse {
      id: mongoose.Types.ObjectId | string;
      name: string;
      email: string;
      image: string | null;
      bio: string;
      provider: string;
      use_original_data: boolean;
      original_line_data?: {
        name: string;
        email: string;
        profile_image: string | null;
      };
    }
    
    const userData: UserResponse = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.profile_image,
      bio: updatedUser.bio || "",
      provider: updatedUser.provider,
      use_original_data: updatedUser.use_original_data || false
    };
    
    // เพิ่มข้อมูลต้นฉบับจาก LINE ถ้ามี
    if (updatedUser.provider === 'line' && updatedUser.original_line_data) {
      userData.original_line_data = updatedUser.original_line_data;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: useOriginalData ? "เปลี่ยนกลับไปใช้ข้อมูลจาก LINE เรียบร้อยแล้ว" : "อัพเดทการตั้งค่าเรียบร้อยแล้ว",
      user: userData
    });
  } catch (error) {
    console.error("Error using LINE data:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการใช้ข้อมูลจาก LINE",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}