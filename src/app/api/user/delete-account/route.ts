import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import LoginHistory from "@/models/loginHistory";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import mongoose from "mongoose";

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

    // ค้นหาผู้ใช้โดยใช้การตรวจสอบว่า userId เป็น ObjectId หรือไม่
    let user;
    
    // ตรวจสอบว่า userId เป็น ObjectId หรือไม่
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    
    if (isValidObjectId) {
      // ค้นหาด้วย _id ถ้าเป็น ObjectId ที่ถูกต้อง
      user = await UserModel.findById(userId);
    } else {
      // ค้นหาด้วย provider_id หรือ email ขึ้นอยู่กับวิธีการล็อกอิน
      if (session.user.provider === 'line') {
        user = await UserModel.findOne({ provider: 'line', provider_id: userId });
      } else {
        // ถ้าเป็น OTP หรือวิธีอื่นๆ ลองค้นหาด้วยอีเมล
        user = await UserModel.findOne({ email: session.user.email });
      }
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบบัญชีผู้ใช้" 
      }, { status: 404 });
    }

    // ลบรูปโปรไฟล์จาก Cloudinary (ถ้ามี)
    if (user.profile_image && user.profile_image.includes('cloudinary')) {
      try {
        // ดึง public_id จาก URL โดยทำอย่างระมัดระวังมากขึ้น
        const url = new URL(user.profile_image);
        const pathname = url.pathname;
        
        // แยกส่วนที่เป็น path ออกมา
        const pathParts = pathname.split('/');
        const uploadIndex = pathParts.indexOf('upload');
        
        // ข้ามส่วนของ version เช่น v1234567890 (มักอยู่หลัง upload)
        let startIndex = uploadIndex + 1;
        if (startIndex < pathParts.length && pathParts[startIndex].startsWith('v')) {
          startIndex++;
        }
        
        // สร้าง public_id จากส่วนที่เหลือของ path
        const publicIdParts = pathParts.slice(startIndex).filter(Boolean);
        const publicId = publicIdParts.join('/');
        
        // นำ extension ของไฟล์ออก ถ้ามี
        const publicIdWithoutExt = publicId.replace(/\.[^/.]+$/, "");
        
        console.log("Attempting to delete image with public_id:", publicIdWithoutExt);
        
        const result = await deleteFromCloudinary(publicIdWithoutExt);
        console.log("Cloudinary delete result:", result);
      } catch (error) {
        console.error("Error deleting profile image from Cloudinary:", error);
        // ไม่หยุดการดำเนินการหากไม่สามารถลบรูปได้
      }
    }

    // ลบประวัติการเข้าสู่ระบบ
    await LoginHistory.deleteMany({ user_id: user._id });

    // ลบบัญชีผู้ใช้
    await UserModel.findByIdAndDelete(user._id);

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