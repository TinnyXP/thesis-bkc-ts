// src/app/api/admin/users/[id]/update-profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { withAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * API สำหรับอัปเดตข้อมูลโปรไฟล์ของผู้ใช้ (สำหรับผู้ดูแลระบบ)
 */
export const POST = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // รับข้อมูลจาก form
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const profileImage = formData.get('profileImage') as File | null;
    const removeProfileImage = formData.get('removeProfileImage') === 'true';
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || name.trim() === '') {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกชื่อผู้ใช้"
      }, { status: 400 });
    }
    
    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // ไม่อนุญาตให้แก้ไขข้อมูลของ superadmin หลัก
    if (user.role === 'superadmin' && user.email === 'thesis.bangkachao.64@gmail.com') {
      const adminSession = await getServerSession(authOptions);
      if (!adminSession?.user || adminSession.user.email !== 'thesis.bangkachao.64@gmail.com') {
        return NextResponse.json({
          success: false,
          message: "ไม่สามารถแก้ไขข้อมูลของ Super Admin หลักได้"
        }, { status: 403 });
      }
    }
    
    // เตรียมข้อมูลที่จะอัปเดต
    const updateData: Record<string, any> = {
      name
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
    }
    
    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: "อัปเดตข้อมูลผู้ใช้สำเร็จ",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.profile_image,
        bkcId: updatedUser.bkc_id
      }
    });
    
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});