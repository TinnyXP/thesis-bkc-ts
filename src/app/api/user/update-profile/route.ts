// src/app/api/user/update-profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import mongoose from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { v4 as uuidv4 } from "uuid";

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

    // ต้องการ bkc_id เป็นหลักเสมอ
    if (!session.user.bkcId) {
      return NextResponse.json({
        success: false,
        message: "ไม่สามารถระบุตัวตนของผู้ใช้ได้"
      }, { status: 400 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const profileImage = formData.get("profileImage") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null; // เพิ่มการรับ imageUrl
    const removeProfileImage = formData.get("removeProfileImage") === "true";

    if (!name) {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกชื่อ"
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาผู้ใช้ด้วย bkc_id
    let user = await UserModel.findOne({ bkc_id: session.user.bkcId });

    // ถ้าไม่พบ ลองใช้ MongoDB ID เป็นทางเลือกสุดท้าย (สำหรับข้อมูลเก่า)
    if (!user && session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)) {
      user = await UserModel.findById(session.user.id);

      // ถ้าพบผู้ใช้ที่ยังไม่มี bkc_id ให้สร้างใหม่และอัพเดต
      if (user && !user.bkc_id) {
        user.bkc_id = uuidv4();
        await user.save();
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบบัญชีผู้ใช้"
      }, { status: 404 });
    }

    // เก็บข้อมูล provider เพื่อล็อก
    const sessionProvider = session.user.provider;
    const userProvider = user.provider;

    // ล็อกข้อมูลเพื่อดีบัก
    console.log(`Update profile attempt - Session provider: ${sessionProvider}, DB provider: ${userProvider}`);

    // ยกเลิกการตรวจสอบ provider - อนุญาตให้ทั้ง LINE และ OTP สามารถอัพเดตได้
    /* 
    if (user.provider !== session.user.provider) {
      console.log(`Provider mismatch: DB=${user.provider}, Session=${session.user.provider}`);
      return NextResponse.json({ 
        success: false, 
        message: "ไม่สามารถอัพเดตโปรไฟล์ของบัญชีนี้ได้" 
      }, { status: 403 });
    }
    */

    // เตรียมข้อมูลที่จะอัปเดต
    // เตรียมข้อมูลที่จะอัปเดต
    const updateData: {
      name: string;
      profile_image?: string | null;
      profile_completed: boolean;
    } = {
      name,
      profile_completed: true
    };

    // จัดการกับรูปโปรไฟล์
    if (removeProfileImage) {
      // ถ้าต้องการลบรูปโปรไฟล์
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
    } else if (imageUrl) {
      // ถ้ามี URL ของรูปภาพที่ส่งมา (เช่น จาก LINE)
      updateData.profile_image = imageUrl;
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    );

    console.log(`Profile updated for user ${updatedUser._id} (${updatedUser.provider}) with bkc_id ${updatedUser.bkc_id}`);

    return NextResponse.json({
      success: true,
      message: "อัปเดตโปรไฟล์สำเร็จ",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        image: updatedUser.profile_image,
        bkcId: updatedUser.bkc_id
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