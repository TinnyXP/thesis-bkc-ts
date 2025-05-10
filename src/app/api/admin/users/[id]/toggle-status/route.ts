// src/app/api/admin/users/[id]/toggle-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { withAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * API สำหรับเปลี่ยนสถานะการใช้งานของผู้ใช้ (ระงับ/เปิดใช้งาน)
 */
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  context: { params: Record<string, string> }
) => {
  try {
    const { isActive } = await request.json();
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: "กรุณาระบุสถานะที่ต้องการเปลี่ยน (isActive)"
      }, { status: 400 });
    }
    
    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(context.params.id);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // ไม่อนุญาตให้แก้ไขสถานะของ superadmin
    if (user.role === 'superadmin' && user.email === 'thesis.bangkachao.64@gmail.com') {
      return NextResponse.json({
        success: false,
        message: "ไม่สามารถแก้ไขสถานะของ Super Admin หลักได้"
      }, { status: 403 });
    }
    
    // อัปเดตสถานะการใช้งาน
    user.is_active = isActive;
    await user.save();
    
    const statusText = isActive ? "เปิดใช้งาน" : "ระงับการใช้งาน";
    
    return NextResponse.json({
      success: true,
      message: `${statusText}ผู้ใช้เรียบร้อยแล้ว`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isActive: user.is_active
      }
    });
    
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});