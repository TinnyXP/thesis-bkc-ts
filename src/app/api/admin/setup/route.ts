// src/app/api/admin/setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { withSuperAdminAuth } from "@/lib/middleware/adminMiddleware";

// อีเมลที่จะตั้งเป็น Super Admin จาก environment variable
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "thesis.bangkachao.64@gmail.com";

// Admin เริ่มต้น (สำหรับรันตอนเริ่มต้นระบบเท่านั้น)
export async function GET() {
  try {
    await connectDB();
    
    // ตรวจสอบว่าอีเมลจาก environment variable มีอยู่ในระบบหรือไม่
    const existingAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    
    if (existingAdmin) {
      // ถ้ามีอยู่แล้ว ให้ตรวจสอบว่าเป็น superadmin หรือไม่
      if (existingAdmin.role === 'superadmin') {
        return NextResponse.json({
          success: true,
          message: `Super Admin (${SUPER_ADMIN_EMAIL}) ถูกตั้งค่าไว้แล้ว`,
          admin: {
            id: existingAdmin._id.toString(),
            name: existingAdmin.name,
            email: existingAdmin.email,
            role: existingAdmin.role
          }
        });
      }
      
      // ถ้าไม่ใช่ superadmin ให้ปรับให้เป็น superadmin
      existingAdmin.role = 'superadmin';
      existingAdmin.admin_permissions = ['all'];
      await existingAdmin.save();
      
      return NextResponse.json({
        success: true,
        message: `อัปเดต ${SUPER_ADMIN_EMAIL} เป็น Super Admin เรียบร้อยแล้ว`,
        admin: {
          id: existingAdmin._id.toString(),
          name: existingAdmin.name,
          email: existingAdmin.email,
          role: existingAdmin.role
        }
      });
    }
    
    // ถ้ายังไม่มีในระบบ ให้ตอบกลับว่าต้องสมัครสมาชิกด้วยอีเมลนี้ก่อน
    return NextResponse.json({
      success: false,
      message: `ไม่พบผู้ใช้ที่มีอีเมล ${SUPER_ADMIN_EMAIL} ในระบบ กรุณาสมัครสมาชิกก่อน`
    }, { status: 404 });
    
  } catch (error) {
    console.error("Error setting up admin:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการตั้งค่า Super Admin",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// เพิ่มแอดมินใหม่
export const POST = withSuperAdminAuth(async (req: NextRequest) => {
  try {
    const { bkcId, permissions } = await req.json();
    
    if (!bkcId) {
      return NextResponse.json({
        success: false,
        message: "กรุณาระบุ BKC ID ของผู้ใช้ที่ต้องการตั้งเป็นแอดมิน"
      }, { status: 400 });
    }
    
    // ตรวจสอบว่ามีผู้ใช้นี้ในระบบหรือไม่
    const user = await User.findOne({ bkc_id: bkcId });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: `ไม่พบผู้ใช้ที่มี BKC ID: ${bkcId}`
      }, { status: 404 });
    }
    
    // ตั้งค่าให้เป็นแอดมิน
    user.role = 'admin';
    if (permissions && Array.isArray(permissions)) {
      user.admin_permissions = permissions;
    } else {
      user.admin_permissions = ['general']; // สิทธิ์พื้นฐาน
    }
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: `ตั้งค่าให้ ${user.name} (${user.email}) เป็นแอดมินเรียบร้อยแล้ว`,
      admin: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.admin_permissions
      }
    });
    
  } catch (error) {
    console.error("Error adding admin:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มแอดมิน",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});