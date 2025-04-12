// src/app/api/auth/create-profile/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import LoginHistory from "@/models/loginHistory";
import mongoose from "mongoose";

// ป้องกันการ cache
export const dynamic = 'force-dynamic';

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

    // ควรตรวจสอบว่าเป็น new-user หรือมีสถานะ isNewUser จริงๆ
    if (session.user.id !== 'new-user' && !session.user.isNewUser) {
      console.log("CreateProfile API: Not a new user, checking if exists");
      // ตรวจสอบว่ามีผู้ใช้นี้ในระบบหรือไม่
      await connectDB();

      // ค้นหาด้วย ID ถ้าเป็น ObjectId ที่ถูกต้อง
      let existingUser = null;
      if (mongoose.Types.ObjectId.isValid(session.user.id)) {
        existingUser = await UserModel.findById(session.user.id);
      }

      // ถ้าไม่พบ แต่มี email ให้ลองค้นหาด้วย email
      if (!existingUser && session.user.email) {
        existingUser = await UserModel.findOne({
          email: session.user.email,
          provider: session.user.provider || 'otp'
        });
      }

      // ถ้ายังไม่พบและเป็น LINE ID ให้ลองค้นหาด้วย provider_id
      if (!existingUser && session.user.id.startsWith('U')) {
        existingUser = await UserModel.findOne({
          provider: 'line',
          provider_id: session.user.id
        });
      }

      // ถ้ายังไม่พบอีก ก็อนุญาตให้สร้างโปรไฟล์ใหม่
      if (existingUser) {
        console.log("CreateProfile API: User already exists:", existingUser._id.toString());
      }
    }

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

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลอีเมล"
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
      } else {
        console.log("CreateProfile API: Image upload failed or incomplete result");
      }
    } else {
      console.log("CreateProfile API: No profile image provided");
    }

    // สร้างรหัสเฉพาะสำหรับผู้ใช้ OTP
    const uniqueProviderId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // กำหนด provider จาก session หรือใช้ค่าเริ่มต้น 'otp'
    const provider = session.user.provider || 'otp';

    // ตรวจสอบว่ามีผู้ใช้ที่มี email นี้อยู่แล้วหรือไม่
    // ปรับปรุงลอจิกการค้นหาผู้ใช้
    let user = null;
    let isNewUserCreated = false;

    // กรณีที่ 1: ค้นหาผู้ใช้ตาม Provider ก่อน
    if (provider === 'line' && session.user.id.startsWith('U')) {
      // กรณี LINE
      user = await UserModel.findOne({
        provider: 'line',
        provider_id: session.user.id
      });
      console.log("CreateProfile API: Searching by LINE provider_id:", session.user.id);
    } else if (provider === 'otp' && session.user.email) {
      // กรณี OTP
      user = await UserModel.findOne({
        email,
        provider: 'otp'
      });
      console.log("CreateProfile API: Searching by email for OTP provider:", email);
    }

    // กรณีที่ 2: ถ้ายังไม่พบและมี ID ที่ถูกต้อง
    if (!user && session.user.id !== 'new-user' && mongoose.Types.ObjectId.isValid(session.user.id)) {
      user = await UserModel.findById(session.user.id);
      console.log("CreateProfile API: Searching by ObjectId:", session.user.id);
    }

    // กรณีที่ 3: ยังไม่พบอีก ลองค้นหาด้วยอีเมลโดยไม่สนใจ provider
    if (!user && email) {
      user = await UserModel.findOne({ email });
      console.log("CreateProfile API: Searching by email only:", email);
    }

    // // ถ้าเป็น LINE user ให้ค้นหาด้วย provider_id
    // if (provider === 'line' && session.user.id.startsWith('U')) {
    //   user = await UserModel.findOne({
    //     provider: 'line',
    //     provider_id: session.user.id
    //   });
    // }
    // // ถ้าไม่ใช่ LINE ให้ค้นหาด้วย email และ provider
    // else {
    //   user = await UserModel.findOne({
    //     email,
    //     provider
    //   });
    // }

    // // ถ้าไม่พบผู้ใช้ แต่มี ID ที่ถูกต้อง (ไม่ใช่ 'new-user') ให้ลองค้นหาด้วย ID
    // if (!user && session.user.id !== 'new-user' && mongoose.Types.ObjectId.isValid(session.user.id)) {
    //   user = await UserModel.findById(session.user.id);
    // }

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
      console.log("CreateProfile API: Creating new user with provider:", provider);
      isNewUserCreated = true;

      const userData: {
        name: string;
        email: string;
        bio: string;
        provider: string;
        provider_id?: string;
        profile_image: string | null;
        is_active: boolean;
      } = {
        name,
        email,
        bio,
        provider,
        profile_image: profileImageUrl,
        is_active: true
      };

      // ถ้าเป็น OTP user ให้เพิ่ม provider_id
      if (provider === 'otp') {
        userData.provider_id = uniqueProviderId;
      }
      // ถ้าเป็น LINE user ให้ใช้ ID จาก session
      else if (provider === 'line' && session.user.id.startsWith('U')) {
        userData.provider_id = session.user.id;
      }

      user = await UserModel.create(userData);
    }

    // แน่ใจว่ามีการแปลง _id เป็น string
    const userId = user._id.toString();

    console.log("CreateProfile API: User saved", {
      id: userId,
      name: user.name,
      email: user.email,
      provider: user.provider,
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
        provider: user.provider,
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