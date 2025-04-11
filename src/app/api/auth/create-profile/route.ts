// src/app/api/auth/create-profile/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import LoginHistory from "@/models/loginHistory";
import mongoose from "mongoose";

// ฟังก์ชันบันทึกประวัติการเข้าสู่ระบบ
async function saveLoginHistory(userId: string, userAgent: string, ip: string) {
  try {
    // สร้าง session ID ใหม่
    const sessionId = new mongoose.Types.ObjectId().toString();

    const loginRecord = await LoginHistory.create({
      user_id: userId,
      session_id: sessionId,
      login_time: new Date(),
      ip_address: ip,
      user_agent: userAgent,
      login_status: 'success',
      is_current_session: true
    });

    console.log("CreateProfile: Saved login history", loginRecord._id);
    return sessionId;
  } catch (error) {
    console.error("Error saving login history:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบและเป็นผู้ใช้ใหม่
    const session = await getServerSession(authOptions);
    
    console.log("CreateProfile API: Session check", {
      hasSession: !!session,
      userId: session?.user?.id,
      isNewUser: session?.user?.isNewUser
    });
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }

    // ยกเลิกการตรวจสอบ isNewUser เพื่อให้สามารถแก้ไขโปรไฟล์ได้เสมอ
    // if (!session.user.isNewUser) {
    //   return NextResponse.json({ 
    //     success: false, 
    //     message: "คุณไม่ใช่ผู้ใช้ใหม่" 
    //   }, { status: 403 });
    // }

    // ดึงข้อมูลจาก request
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string || ""; 
    const email = session.user.email;
    const profileImage = formData.get("profileImage") as File | null;

    if (!name) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณากรอกชื่อ" 
      }, { status: 400 });
    }

    // เก็บข้อมูล IP และ User-Agent
    const headersList = request.headers;
    const userAgent = headersList.get('user-agent') || 'Unknown';
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               '127.0.0.1';

    console.log("CreateProfile API: Client info", { ip, userAgent });

    await connectDB();

    // อัปโหลดรูปโปรไฟล์ไปยัง Cloudinary (ถ้ามี)
    let profileImageUrl = null;
    if (profileImage) {
      console.log("CreateProfile API: Uploading profile image");
      const uploadResult = await uploadToCloudinary(profileImage);
      
      if (uploadResult && uploadResult.secure_url) {
        profileImageUrl = uploadResult.secure_url;
        console.log("CreateProfile API: Image uploaded successfully:", profileImageUrl);
      }
    }

    // สร้างรหัสเฉพาะสำหรับผู้ใช้ OTP
    const uniqueProviderId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // ตรวจสอบว่ามีผู้ใช้ที่มี email นี้อยู่แล้วหรือไม่
    let user = await UserModel.findOne({ email, provider: 'otp' });
    let isNewUserCreated = false;
    
    if (user) {
      // อัพเดทผู้ใช้ที่มีอยู่แล้ว
      console.log("CreateProfile API: Updating existing user:", user._id);
      
      // เตรียมข้อมูลที่จะอัพเดท
      const updateData: {
        name: string;
        bio: string;
        is_active: boolean;
        profile_image?: string;
      } = {
        name,
        bio,
        is_active: true
      };
      
      // เพิ่มรูปโปรไฟล์ใหม่ถ้ามีการอัพโหลด
      if (profileImageUrl) {
        updateData.profile_image = profileImageUrl;
      }
      
      // อัพเดทข้อมูลผู้ใช้
      user = await UserModel.findByIdAndUpdate(
        user._id,
        updateData,
        { new: true } // คืนค่าข้อมูลหลังอัพเดท
      );
    } else {
      // สร้างผู้ใช้ใหม่
      console.log("CreateProfile API: Creating new user");
      isNewUserCreated = true;
      user = await UserModel.create({
        name,
        email,
        bio,
        provider: "otp",
        provider_id: uniqueProviderId, 
        profile_image: profileImageUrl,
        is_active: true
      });
    }

    // แน่ใจว่ามีการแปลง _id เป็น string
    const userId = user._id.toString();

    console.log("CreateProfile API: User saved", {
      id: userId,
      name: user.name,
      email: user.email,
      provider: "otp",
      isNewUser: isNewUserCreated
    });

    // บันทึกประวัติการเข้าสู่ระบบ (เฉพาะกรณีสร้างผู้ใช้ใหม่)
    if (isNewUserCreated) {
      const sessionId = await saveLoginHistory(userId, userAgent, ip);
      console.log("CreateProfile API: Login history saved with session ID:", sessionId);
    }

    // ส่งข้อมูลกลับให้ครบถ้วน
    return NextResponse.json({ 
      success: true, 
      message: isNewUserCreated ? "สร้างโปรไฟล์สำเร็จ" : "อัพเดทโปรไฟล์สำเร็จ",
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        image: user.profile_image,
        bio: user.bio,
        provider: "otp",
        isNewUser: false // ชี้ชัดว่าไม่ใช่ผู้ใช้ใหม่แล้ว
      }
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการสร้างโปรไฟล์",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}