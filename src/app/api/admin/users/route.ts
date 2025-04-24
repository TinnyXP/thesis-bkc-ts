// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { withSuperAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * ดึงรายการผู้ใช้ที่เป็น admin ทั้งหมด (สำหรับ superadmin เท่านั้น)
 */
export const GET = withSuperAdminAuth(async () => {
  try {
    await connectDB();
    
    // ดึงข้อมูล admin ทั้งหมด
    const admins = await User.find({ 
      role: { $in: ['admin', 'superadmin'] }
    });
    
    // แปลงข้อมูลก่อนส่งกลับ
    const formattedAdmins = admins.map(admin => ({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.admin_permissions || [],
      bkcId: admin.bkc_id
    }));
    
    return NextResponse.json({
      success: true,
      admins: formattedAdmins
    });
    
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล admin",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});

/**
 * ดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับ superadmin เท่านั้น)
 */
export const POST = withSuperAdminAuth(async (request: NextRequest) => {
  try {
    const { search } = await request.json();
    
    await connectDB();
    
    // สร้าง query filter
    const filter: Record<string, any> = {};
    
    // ค้นหาจากชื่อหรืออีเมล
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bkc_id: { $regex: search, $options: 'i' } }
      ];
    }
    
    // ดึงข้อมูลผู้ใช้
    const users = await User.find(filter).limit(20);
    
    // แปลงข้อมูลก่อนส่งกลับ
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      bkcId: user.bkc_id,
      image: user.profile_image
    }));
    
    return NextResponse.json({
      success: true,
      users: formattedUsers
    });
    
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการค้นหาผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});