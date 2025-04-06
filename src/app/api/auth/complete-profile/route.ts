import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route"; // เราต้องเอา authOptions มาใช้
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

    // สร้างผู้ใช้ใหม่
    const newUser = await UserModel.create({
      name,
      email,
      provider: "otp",
      profile_image: profileImageUrl,
      is_active: true
    });

    return NextResponse.json({ 
      success: true, 
      message: "สร้างโปรไฟล์สำเร็จ",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.profile_image
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