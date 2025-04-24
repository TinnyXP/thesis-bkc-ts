// src/app/api/forum/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ForumPost } from "@/models/forum";
import User from "@/models/user";
import { withAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * ดึงข้อมูลกระทู้รายการเดียว
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // ดึงข้อมูลกระทู้
    const post = await ForumPost.findById(params.id);
    
    if (!post) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบกระทู้ที่ต้องการ"
      }, { status: 404 });
    }
    
    // อัปเดตจำนวนการดู
    post.view_count += 1;
    await post.save();
    
    return NextResponse.json({
      success: true,
      post
    });
    
  } catch (error) {
    console.error("Error fetching forum post:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลกระทู้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * แก้ไขกระทู้
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนแก้ไขกระทู้" 
      }, { status: 401 });
    }

    const { title, content, category, tags } = await request.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title || !content || !category) {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน (หัวข้อ, เนื้อหา, และหมวดหมู่)"
      }, { status: 400 });
    }

    await connectDB();
    
    // ดึงข้อมูลกระทู้
    const post = await ForumPost.findById(params.id);
    
    if (!post) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบกระทู้ที่ต้องการ"
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าเป็นเจ้าของกระทู้หรือไม่
    if (post.user_bkc_id !== session.user.bkcId) {
      // ตรวจสอบว่าเป็น admin หรือไม่
      const user = await User.findOne({ bkc_id: session.user.bkcId });
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return NextResponse.json({
          success: false,
          message: "คุณไม่มีสิทธิ์ในการแก้ไขกระทู้นี้"
        }, { status: 403 });
      }
    }
    
    // แปลง tags จาก string เป็น array (ถ้ามี)
    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim())) : [];
    
    // อัปเดตข้อมูลกระทู้
    post.title = title;
    post.content = content;
    post.category = category;
    post.tags = tagsArray;
    
    await post.save();
    
    return NextResponse.json({
      success: true,
      message: "แก้ไขกระทู้สำเร็จ",
      post
    });
    
  } catch (error) {
    console.error("Error updating forum post:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการแก้ไขกระทู้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * ลบกระทู้ (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนลบกระทู้" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ดึงข้อมูลกระทู้
    const post = await ForumPost.findById(params.id);
    
    if (!post) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบกระทู้ที่ต้องการ"
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าเป็นเจ้าของกระทู้หรือไม่
    if (post.user_bkc_id !== session.user.bkcId) {
      // ตรวจสอบว่าเป็น admin หรือไม่
      const user = await User.findOne({ bkc_id: session.user.bkcId });
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return NextResponse.json({
          success: false,
          message: "คุณไม่มีสิทธิ์ในการลบกระทู้นี้"
        }, { status: 403 });
      }
    }
    
    // ทำ soft delete และตั้งเวลาลบจริง
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // เก็บไว้ 30 วันก่อนลบจริง
    
    post.is_deleted = true;
    post.expireAt = expiryDate;
    await post.save();
    
    return NextResponse.json({
      success: true,
      message: "ลบกระทู้เรียบร้อยแล้ว"
    });
    
  } catch (error) {
    console.error("Error deleting forum post:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบกระทู้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * ปักหมุดหรือยกเลิกการปักหมุดกระทู้ (สำหรับ admin เท่านั้น)
 */
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { is_pinned } = await request.json();
    
    if (typeof is_pinned !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาระบุ is_pinned เป็น true หรือ false"
      }, { status: 400 });
    }
    
    // ดึงข้อมูลกระทู้
    const post = await ForumPost.findById(params.id);
    
    if (!post) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบกระทู้ที่ต้องการ"
      }, { status: 404 });
    }
    
    // อัปเดตการปักหมุด
    post.is_pinned = is_pinned;
    await post.save();
    
    return NextResponse.json({
      success: true,
      message: is_pinned ? "ปักหมุดกระทู้เรียบร้อยแล้ว" : "ยกเลิกการปักหมุดกระทู้เรียบร้อยแล้ว",
      post
    });
    
  } catch (error) {
    console.error("Error updating pin status:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะการปักหมุด",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});