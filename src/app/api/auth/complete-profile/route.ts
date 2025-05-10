// src/app/api/auth/complete-profile/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบและเป็นผู้ใช้ใหม่
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isNewUser) {
      return NextResponse.json({
        success: false,
        message: "ไม่ได้รับอนุญาต"
      }, { status: 401 });
    }

    // ต้องมี bkc_id และ email
    if (!session.user.bkcId || !session.user.email) {
      return NextResponse.json({
        success: false,
        message: "ข้อมูลผู้ใช้ไม่ครบถ้วน"
      }, { status: 400 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const profileImage = formData.get("profileImage") as File | null;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกชื่อ"
      }, { status: 400 });
    }

    await connectDB();

    // อัปโหลดรูปโปรไฟล์ไปยัง Cloudinary (ถ้ามี)
    let profileImageUrl = null;
    if (profileImage) {
      const uploadResult = await uploadToCloudinary(profileImage);
      if (uploadResult && uploadResult.secure_url) {
        profileImageUrl = uploadResult.secure_url;
      }
    }

    // ค้นหาผู้ใช้ด้วย bkc_id
    const user = await UserModel.findOne({ 
      bkc_id: session.user.bkcId,
      provider: 'otp'  // อนุญาตเฉพาะผู้ใช้ OTP เท่านั้น
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบบัญชีผู้ใช้"
      }, { status: 404 });
    }

    // อัปเดตข้อมูลผู้ใช้
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        name,
        profile_image: profileImageUrl,
        profile_completed: true,
        is_active: true
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "สร้างโปรไฟล์สำเร็จ",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.profile_image,
        bkcId: updatedUser.bkc_id,
        isNewUser: false
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