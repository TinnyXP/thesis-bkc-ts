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

    // ดึงข้อมูลจาก request body
    let confirmDelete = true;
    try {
      const body = await request.json();
      confirmDelete = body.confirmDelete !== false; // ค่าเริ่มต้นเป็น true ถ้าไม่ได้ส่งค่ามา
    } catch {
      // ถ้าไม่มี body หรือ parse ไม่ได้ ให้ใช้ค่าเริ่มต้น
      console.warn("Failed to parse request body, using default values");
    }
    
    if (!confirmDelete) {
      return NextResponse.json({ 
        success: false, 
        message: "ยังไม่ได้ยืนยันการลบบัญชี" 
      }, { status: 400 });
    }

    // ตรวจสอบว่ามี bkcId หรือไม่
    if (!session.user.bkcId) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้ (Missing bkcId)" 
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาผู้ใช้ด้วย bkc_id
    const user = await UserModel.findOne({ bkc_id: session.user.bkcId });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบบัญชีผู้ใช้" 
      }, { status: 404 });
    }

    console.log("Found user to delete:", {
      id: user._id,
      bkc_id: user.bkc_id,
      provider: user.provider,
      session_provider: session.user.provider
    });

    // ไม่ต้องตรวจสอบ provider เนื่องจากอาจทำให้เกิดปัญหา
    // เราใช้ bkc_id เป็นตัวระบุหลักอยู่แล้ว ซึ่งควรจะเพียงพอสำหรับความปลอดภัย

    // ลบรูปโปรไฟล์จาก Cloudinary (ถ้ามี)
    if (user.profile_image && user.profile_image.includes('cloudinary')) {
      try {
        // ดึง public_id จาก URL
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
    try {
      await LoginHistory.deleteMany({ user_id: user._id });
      console.log(`Deleted login history for user ${user._id}`);
    } catch (error) {
      console.error("Error deleting login history:", error);
      // ไม่หยุดการดำเนินการหากไม่สามารถลบประวัติได้
    }

    // ลบบัญชีผู้ใช้
    try {
      const deleteResult = await UserModel.findByIdAndDelete(user._id);
      console.log("Delete result:", deleteResult);
    } catch (error) {
      console.error("Error deleting user account:", error);
      return NextResponse.json({ 
        success: false, 
        message: "เกิดข้อผิดพลาดในการลบบัญชี",
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

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