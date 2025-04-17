// src/app/api/comments/[postId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/comment";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ดึงคอมเมนต์ทั้งหมดของบทความ
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    await connectDB();
    
    const comments = await Comment.find({ 
      post_id: params.postId,
      is_deleted: false 
    }).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      comments
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลคอมเมนต์"
    }, { status: 500 });
  }
}

// เพิ่มคอมเมนต์ใหม่
export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น" 
      }, { status: 401 });
    }

    await connectDB();
    
    const { content, parentId } = await request.json();
    
    if (!content || content.trim() === "") {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณากรอกข้อความ" 
      }, { status: 400 });
    }
    
    // ใช้ bkcId เป็นตัวอ้างอิงหลัก แต่ยังเก็บ id ไว้เพื่อรองรับระบบเก่า
    const newComment = await Comment.create({
      post_id: params.postId,
      user_id: session.user.id,
      user_bkc_id: session.user.bkcId,
      user_name: session.user.name || "ผู้ใช้ไม่ระบุชื่อ",
      user_image: session.user.image,
      content: content.trim(),
      parent_id: parentId || null
    });
    
    return NextResponse.json({ 
      success: true, 
      comment: newComment
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์"
    }, { status: 500 });
  }
}