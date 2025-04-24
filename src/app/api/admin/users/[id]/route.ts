// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { withSuperAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * ดึงข้อมูลผู้ใช้ที่เป็น admin (สำหรับ superadmin เท่านั้น)
 */
export const GET = withSuperAdminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await connectDB();
    
    // ดึงข้อมูล admin
    const admin = await User.findById(params.id);
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        message: "ผู้ใช้นี้ไม่ใช่ admin"
      }, { status: 400 });
    }
    
    // แปลงข้อมูลก่อนส่งกลับ
    const formattedAdmin = {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.admin_permissions || [],
      bkcId: admin.bkc_id
    };
    
    return NextResponse.json({
      success: true,
      admin: formattedAdmin
    });
    
  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล admin",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});

/**
 * อัปเดตข้อมูลผู้ใช้ที่เป็น admin (สำหรับ superadmin เท่านั้น)
 */
export const PATCH = withSuperAdminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { permissions } = await request.json();
    
    await connectDB();
    
    // ดึงข้อมูล admin
    const admin = await User.findById(params.id);
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        message: "ผู้ใช้นี้ไม่ใช่ admin"
      }, { status: 400 });
    }
    
    // ตรวจสอบว่าไม่ได้พยายามแก้ไข superadmin
    if (admin.role === 'superadmin' && admin.email === 'thesis.bangkachao.64@gmail.com') {
      return NextResponse.json({
        success: false,
        message: "ไม่สามารถแก้ไขสิทธิ์ของ Super Admin หลักได้"
      }, { status: 403 });
    }
    
    // อัปเดตสิทธิ์
    if (permissions && Array.isArray(permissions)) {
      admin.admin_permissions = permissions;
      await admin.save();
    }
    
    // แปลงข้อมูลก่อนส่งกลับ
    const formattedAdmin = {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.admin_permissions || [],
      bkcId: admin.bkc_id
    };
    
    return NextResponse.json({
      success: true,
      message: "อัปเดตสิทธิ์ admin สำเร็จ",
      admin: formattedAdmin
    });
    
  } catch (error) {
    console.error("Error updating admin permissions:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการอัปเดตสิทธิ์ admin",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});

/**
 * ลบสิทธิ์ admin (สำหรับ superadmin เท่านั้น)
 */
export const DELETE = withSuperAdminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await connectDB();
    
    // ดึงข้อมูล admin
    const admin = await User.findById(params.id);
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        message: "ผู้ใช้นี้ไม่ใช่ admin"
      }, { status: 400 });
    }
    
    // ตรวจสอบว่าไม่ได้พยายามลบ superadmin
    if (admin.role === 'superadmin' && admin.email === 'thesis.bangkachao.64@gmail.com') {
      return NextResponse.json({
        success: false,
        message: "ไม่สามารถลบสิทธิ์ของ Super Admin หลักได้"
      }, { status: 403 });
    }
    
    // ลบสิทธิ์ admin
    admin.role = 'user';
    admin.admin_permissions = [];
    await admin.save();
    
    return NextResponse.json({
      success: true,
      message: "ลบสิทธิ์ admin สำเร็จ"
    });
    
  } catch (error) {
    console.error("Error removing admin:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการลบสิทธิ์ admin",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});