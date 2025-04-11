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

// กำหนดเป็น no-store เพื่อไม่ให้ cache การเรียก API นี้
export const fetchCache = 'force-no-store'; 

export async function GET(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("GetProfile API: No session found");
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }

    console.log('GetProfile API: Session user data', {
      id: session.user.id,
      provider: session.user.provider,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      isNewUser: session.user.isNewUser
    });

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // หาข้อมูลผู้ใช้จากฐานข้อมูล - ตรวจสอบตาม ID
    let user = null;
    
    if (session.user.id === 'new-user') {
      console.log('GetProfile API: User is new and not registered yet');
      return NextResponse.json({ 
        success: false, 
        message: "ต้องสร้างโปรไฟล์ให้เสร็จสมบูรณ์ก่อน" 
      }, { status: 400 });
    } 
    
    // ตรวจสอบตามลำดับ
    // 1. ตรวจสอบด้วย MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(session.user.id)) {
      console.log('GetProfile API: Searching user by MongoDB ObjectId');
      user = await UserModel.findById(session.user.id);
      
      if (user) {
        console.log('GetProfile API: Found user by ObjectId');
      }
    }
    
    // 2. ถ้าไม่พบด้วย ObjectId ให้ตรวจสอบว่าเป็น LINE ID หรือไม่
    if (!user && isLineUserId(session.user.id)) {
      console.log('GetProfile API: Searching user by LINE provider_id:', session.user.id);
      user = await UserModel.findOne({ 
        provider: 'line',
        provider_id: session.user.id
      });
      
      if (user) {
        console.log('GetProfile API: Found user by LINE provider_id');
      }
    }
    
    // 3. ถ้ายังไม่พบ ลองค้นหาด้วย provider_id ในกรณีที่เป็น OTP user
    if (!user) {
      console.log('GetProfile API: Trying to find user by provider_id (for OTP users)');
      user = await UserModel.findOne({
        provider: 'otp',
        provider_id: session.user.id
      });
      
      if (user) {
        console.log('GetProfile API: Found user by OTP provider_id');
      }
    }
    
    // 4. ถ้ายังไม่พบและมี email ใน session ลองค้นหาด้วย email
    if (!user && session.user.email) {
      console.log('GetProfile API: Trying to find user by email:', session.user.email);
      user = await UserModel.findOne({
        email: session.user.email
      });
      
      if (user) {
        console.log('GetProfile API: Found user by email');
      }
    }

    // ถ้าไม่พบผู้ใช้จากการค้นหาทั้งหมด
    if (!user) {
      console.log('GetProfile API: User not found with any method for ID:', session.user.id);
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }

    console.log('GetProfile API: User found:', {
      id: user._id.toString(),
      name: user.name,
      provider: user.provider
    });

    // สร้างข้อมูลที่จะส่งกลับ
    interface UserResponse {
      id: string;
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
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.profile_image,
      bio: user.bio || "",
      provider: user.provider,
      use_original_data: user.use_original_data || false
    };
    
    // เพิ่มข้อมูลต้นฉบับจาก LINE ถ้ามี
    if (user.provider === 'line' && user.original_line_data) {
      userData.original_line_data = user.original_line_data;
    }
    
    console.log('GetProfile API: Sending user data response:', userData);
    
    const responseData = {
      success: true,
      user: userData
    };

    // ตั้งค่า cache-control ให้ไม่ cache การเรียก API นี้
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("GetProfile API: Error fetching user profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}