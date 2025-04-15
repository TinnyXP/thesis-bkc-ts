// src/app/api/user/update-profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ" 
      }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const userId = session.user.id;
    const profileImage = formData.get("profileImage") as File | null;
    const removeProfileImage = formData.get("removeProfileImage") === "true";

    if (!name) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณากรอกชื่อ" 
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาผู้ใช้
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบผู้ใช้" 
      }, { status: 404 });
    }

    // อัปเดตข้อมูลผู้ใช้
    const updateData: { name: string; profile_image?: string | null } = { name };

    // จัดการกับรูปโปรไฟล์
    if (removeProfileImage) {
      // ถ้าต้องการลบรูปโปรไฟล์
      if (user.profile_image && user.profile_image.includes('cloudinary')) {
        // ดึง public_id จาก URL
        try {
          const url = new URL(user.profile_image);
          const pathname = url.pathname;
          const pathParts = pathname.split('/');
          const uploadIndex = pathParts.indexOf('upload');
          let startIndex = uploadIndex + 1;
          if (startIndex < pathParts.length && pathParts[startIndex].startsWith('v')) {
            startIndex++;
          }
          const publicIdParts = pathParts.slice(startIndex).filter(Boolean);
          const publicId = publicIdParts.join('/');
          const publicIdWithoutExt = publicId.replace(/\.[^/.]+$/, "");
          
          await deleteFromCloudinary(publicIdWithoutExt);
        } catch (error) {
          console.error("Error deleting profile image:", error);
        }
      }
      updateData.profile_image = null;
    } else if (profileImage) {
      // ถ้ามีการอัปโหลดรูปภาพใหม่
      // ลบรูปเก่าก่อน (ถ้ามี)
      if (user.profile_image && user.profile_image.includes('cloudinary')) {
        try {
          const url = new URL(user.profile_image);
          const pathname = url.pathname;
          const pathParts = pathname.split('/');
          const uploadIndex = pathParts.indexOf('upload');
          let startIndex = uploadIndex + 1;
          if (startIndex < pathParts.length && pathParts[startIndex].startsWith('v')) {
            startIndex++;
          }
          const publicIdParts = pathParts.slice(startIndex).filter(Boolean);
          const publicId = publicIdParts.join('/');
          const publicIdWithoutExt = publicId.replace(/\.[^/.]+$/, "");
          
          await deleteFromCloudinary(publicIdWithoutExt);
        } catch (error) {
          console.error("Error deleting old profile image:", error);
        }
      }

      // อัปโหลดรูปใหม่
      const uploadResult = await uploadToCloudinary(profileImage);
      if (uploadResult && uploadResult.secure_url) {
        updateData.profile_image = uploadResult.secure_url;
      }
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: "อัปเดตโปรไฟล์สำเร็จ",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        image: updatedUser.profile_image
      }
    });
    
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}