// src/app/api/admin/check/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export const dynamic = 'force-dynamic';
/**
 * API ตรวจสอบว่าผู้ใช้ปัจจุบันเป็น admin หรือไม่
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        isAdmin: false,
        isSuperAdmin: false,
        message: "ไม่ได้เข้าสู่ระบบ" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        isAdmin: false,
        isSuperAdmin: false,
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }
    
    // ตรวจสอบสถานะ admin
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const isSuperAdmin = user.role === 'superadmin';
    
    // ส่งข้อมูลกลับไป
    return NextResponse.json({
      success: true,
      isAdmin,
      isSuperAdmin,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.admin_permissions || []
      }
    });
    
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ 
      success: false, 
      isAdmin: false,
      isSuperAdmin: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะ admin",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}