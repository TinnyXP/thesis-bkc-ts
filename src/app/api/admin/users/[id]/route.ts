// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import Bookmark from "@/models/bookmark";
import Comment from "@/models/comment";
import LoginHistory from "@/models/loginHistory";
import { withAdminAuth } from "@/lib/middleware/adminMiddleware";
import { deleteFromCloudinary } from "@/lib/cloudinary";

/**
 * API สำหรับดึงข้อมูลผู้ใช้
 */
export const GET = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // แปลงข้อมูลก่อนส่งกลับ
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
      bkcId: user.bkc_id,
      isActive: user.is_active,
      profileCompleted: user.profile_completed,
      image: user.profile_image,
      createdAt: user.createdAt.toISOString()
    };
    
    return NextResponse.json({
      success: true,
      user: userData
    });
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});

/**
 * API สำหรับแก้ไขข้อมูลผู้ใช้
 */
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const updateData = await request.json();
    
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
      return NextResponse.json({
        success: false,
        message: "ไม่สามารถแก้ไขข้อมูลของ Super Admin หลักได้"
      }, { status: 403 });
    }
    
    // กำหนดฟิลด์ที่อนุญาตให้แก้ไข
    const allowedFields = ['name', 'is_active', 'profile_completed'];
    
    // อัปเดตข้อมูลเฉพาะฟิลด์ที่อนุญาต
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        // แปลงชื่อฟิลด์จาก camelCase เป็น snake_case
        const dbField = field === 'isActive' ? 'is_active' : 
                        field === 'profileCompleted' ? 'profile_completed' : field;
        
        user[dbField] = updateData[field];
      }
    });
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: "อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isActive: user.is_active,
        profileCompleted: user.profile_completed
      }
    });
    
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});

/**
 * API สำหรับลบผู้ใช้
 */
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // ไม่อนุญาตให้ลบ superadmin หลัก
    if (user.role === 'superadmin' && user.email === 'thesis.bangkachao.64@gmail.com') {
      return NextResponse.json({
        success: false,
        message: "ไม่สามารถลบบัญชี Super Admin หลักได้"
      }, { status: 403 });
    }
    
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
        
        await deleteFromCloudinary(publicIdWithoutExt);
      } catch (error) {
        console.error("Error deleting profile image from Cloudinary:", error);
        // ไม่หยุดการดำเนินการหากไม่สามารถลบรูปได้
      }
    }
    
    // ลบข้อมูลที่เกี่ยวข้องของผู้ใช้
    
    // 1. ลบบุ๊คมาร์คทั้งหมด
    await Bookmark.deleteMany({ user_bkc_id: user.bkc_id });
    
    // 2. ลบคอมเมนต์ทั้งหมด (หรือทำ soft delete)
    await Comment.updateMany(
      { user_bkc_id: user.bkc_id },
      { is_deleted: true, expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // เก็บไว้ 30 วันก่อนลบจริง
    );
    
    // 3. ลบประวัติการเข้าสู่ระบบ
    await LoginHistory.deleteMany({ user_id: user._id });
    
    // 4. ลบผู้ใช้
    await User.findByIdAndDelete(user._id);
    
    return NextResponse.json({
      success: true,
      message: "ลบผู้ใช้เรียบร้อยแล้ว"
    });
    
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการลบผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});