// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { withAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * API สำหรับดึงข้อมูลผู้ใช้
 */
export const GET = withAdminAuth(async (
  request: NextRequest,
  context: { params: Record<string, string> }
) => {
  try {
    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(context.params.id);
    
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
  context: { params: Record<string, string> }
) => {
  try {
    const updateData = await request.json();
    
    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(context.params.id);
    
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
// ฟังก์ชันลบสิทธิ์ admin (แก้ไขจากการลบบัญชี)
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  context: { params: Record<string, string> }
) => {
  try {
    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(context.params.id);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // ไม่อนุญาตให้ลบสิทธิ์ superadmin หลัก
    if (user.role === 'superadmin' && user.email === 'thesis.bangkachao.64@gmail.com') {
      return NextResponse.json({
        success: false,
        message: "ไม่สามารถลบสิทธิ์ Super Admin หลักได้"
      }, { status: 403 });
    }
    
    // ลบสิทธิ์ admin โดยการเปลี่ยนบทบาทกลับเป็นผู้ใช้ทั่วไป
    user.role = 'user';
    user.admin_permissions = []; // ลบสิทธิ์พิเศษทั้งหมด
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: "ลบสิทธิ์ผู้ดูแลระบบเรียบร้อยแล้ว"
    });
    
  } catch (error) {
    console.error("Error removing admin permissions:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการลบสิทธิ์ผู้ดูแลระบบ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});