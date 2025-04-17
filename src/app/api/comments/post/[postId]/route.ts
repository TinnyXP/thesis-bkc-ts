// src/app/api/comments/post/[postId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/comment";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/user";

// ดึงคอมเมนต์ทั้งหมดของบทความ
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    await connectDB();
    
    // เพิ่มเงื่อนไข is_deleted: false เพื่อกรองคอมเมนต์ที่ถูกลบแล้ว
    const comments = await Comment.find({ 
      post_id: params.postId,
      is_deleted: false // เพิ่มเงื่อนไขนี้เพื่อไม่ดึงคอมเมนต์ที่ถูกลบแล้ว
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
// แก้ไขในส่วนของ POST request

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
    
    // ดึงข้อมูลผู้ใช้ล่าสุดจาก database
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }
    
    // ใช้ข้อมูลจาก database แทนที่จาก session
    const newComment = await Comment.create({
      post_id: params.postId,
      user_id: user._id.toString(),
      user_bkc_id: user.bkc_id,
      user_name: user.name, // ใช้ชื่อจาก database
      user_image: user.profile_image, // ใช้รูปโปรไฟล์จาก database
      content: content.trim(),
      parent_id: parentId || null,
      is_deleted: false
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