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

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = session.user.email;
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

    // แทนการสร้างผู้ใช้ใหม่ ให้อัปเดตผู้ใช้ที่มีอยู่แล้ว
    const updatedUser = await UserModel.findOneAndUpdate(
      { email: email, provider: "otp" }, // ค้นหาด้วยอีเมลแทนการใช้ ID
      {
        name,
        profile_image: profileImageUrl,
        profile_completed: true, // อัปเดตสถานะว่ากรอกข้อมูลเรียบร้อยแล้ว
        is_active: true
      },
      { new: true }
    );

    // ส่งข้อมูลกลับให้ครบถ้วนมากขึ้น
    return NextResponse.json({
      success: true,
      message: "สร้างโปรไฟล์สำเร็จ",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.profile_image,
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