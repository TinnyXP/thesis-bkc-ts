// src/app/api/user/delete-account/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import LoginHistory from "@/models/loginHistory";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function DELETE(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ" 
      }, { status: 401 });
    }

    const { userId } = await request.json();

    // ตรวจสอบว่า userId ตรงกับ session
    if (session.user.id !== userId) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่มีสิทธิ์ลบบัญชีนี้" 
      }, { status: 403 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาข้อมูลผู้ใช้
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบบัญชีผู้ใช้" 
      }, { status: 404 });
    }

    // ลบรูปโปรไฟล์จาก Cloudinary (ถ้ามี)
    if (user.profile_image && user.profile_image.includes('cloudinary')) {
      try {
        // ดึง public_id จาก URL
        const urlParts = user.profile_image.split('/');
        const filenameWithExt = urlParts[urlParts.length - 1];
        const filename = filenameWithExt.split('.')[0];
        const folderPath = urlParts[urlParts.length - 2];
        const publicId = `${folderPath}/${filename}`;
        
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error("Error deleting profile image from Cloudinary:", error);
        // ไม่หยุดการดำเนินการหากไม่สามารถลบรูปได้
      }
    }

    // ลบประวัติการเข้าสู่ระบบ
    await LoginHistory.deleteMany({ user_id: userId });

    // ลบบัญชีผู้ใช้
    await UserModel.findByIdAndDelete(userId);

    return NextResponse.json({ 
      success: true, 
      message: "ลบบัญชีเรียบร้อยแล้ว" 
    });
    
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการลบบัญชี",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}