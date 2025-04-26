// src/app/api/admin/users/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { withAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * API สำหรับดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับผู้ดูแลระบบ)
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    await connectDB();
    
    // สร้าง query filter
    const filter: Record<string, unknown> = {};
    
    // ค้นหาจากชื่อหรืออีเมลหรือ bkc_id
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bkc_id: { $regex: search, $options: 'i' } }
      ];
    }
    
    // ดึงข้อมูลผู้ใช้ทั้งหมด
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
    
    // แปลงข้อมูลก่อนส่งกลับ
    const formattedUsers = users.map(user => ({
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
    }));
    
    return NextResponse.json({
      success: true,
      users: formattedUsers
    });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});