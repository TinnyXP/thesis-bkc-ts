// src/app/api/auth/create-profile/route.ts
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
    const bio = formData.get("bio") as string || ""; // ดึงค่า bio และกำหนดค่าเริ่มต้นเป็น ""
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

    // สร้างผู้ใช้ใหม่ - เพิ่ม bio ในการสร้าง
    const newUser = await UserModel.create({
      name,
      email,
      bio,  // เพิ่ม bio ที่ได้จากฟอร์ม
      provider: "otp",
      provider_id: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, 
      profile_image: profileImageUrl,
      is_active: true
    });

    console.log("Created new user with bio:", newUser); // Log เพื่อตรวจสอบว่ามีการบันทึก bio

    // ส่งข้อมูลกลับให้ครบถ้วนมากขึ้น
    return NextResponse.json({ 
      success: true, 
      message: "สร้างโปรไฟล์สำเร็จ",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        image: newUser.profile_image,
        bio: newUser.bio, // ส่งค่า bio กลับไปด้วย
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