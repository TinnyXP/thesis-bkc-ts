// src/app/api/forum/posts/[id]/replies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ForumPost, ForumReply } from "@/models/forum";
import User from "@/models/user";

/**
 * ดึงการตอบกลับทั้งหมดของกระทู้
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ดึงพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    await connectDB();
    
    // ตรวจสอบว่ากระทู้มีอยู่จริงหรือไม่
    const post = await ForumPost.findById(params.id);
    
    if (!post) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบกระทู้ที่ต้องการ"
      }, { status: 404 });
    }
    
    // นับจำนวนการตอบกลับทั้งหมด
    const total = await ForumReply.countDocuments({ 
      post_id: params.id, 
      is_deleted: false
    });
    
    // ดึงข้อมูลการตอบกลับโดยเรียงตามเวลาที่สร้าง
    const replies = await ForumReply.find({ 
      post_id: params.id, 
      is_deleted: false
    })
      .sort({ is_solution: -1, createdAt: 1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({ 
      success: true, 
      replies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
    
  } catch (error) {
    console.error("Error fetching forum replies:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลการตอบกลับ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * เพิ่มการตอบกลับใหม่
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนตอบกลับ" 
      }, { status: 401 });
    }

    const { content, parent_id } = await request.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!content || content.trim() === "") {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกเนื้อหาการตอบกลับ"
      }, { status: 400 });
    }

    await connectDB();
    
    // ตรวจสอบว่ากระทู้มีอยู่จริงหรือไม่
    const post = await ForumPost.findById(params.id);
    
    if (!post) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบกระทู้ที่ต้องการ"
      }, { status: 404 });
    }
    
    // ตรวจสอบ parent_id (ถ้ามี)
    if (parent_id) {
      const parentReply = await ForumReply.findById(parent_id);
      if (!parentReply || parentReply.post_id !== params.id) {
        return NextResponse.json({
          success: false,
          message: "ไม่พบการตอบกลับที่ต้องการอ้างถึง"
        }, { status: 404 });
      }
    }
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // สร้างการตอบกลับใหม่
    const newReply = await ForumReply.create({
      post_id: params.id,
      content,
      user_bkc_id: user.bkc_id,
      user_name: user.name,
      user_image: user.profile_image,
      is_solution: false,
      is_deleted: false,
      parent_id: parent_id || null
    });
    
    return NextResponse.json({
      success: true,
      message: "เพิ่มการตอบกลับสำเร็จ",
      reply: newReply
    });
    
  } catch (error) {
    console.error("Error creating forum reply:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการตอบกลับ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}