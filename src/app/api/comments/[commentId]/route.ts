// src/app/api/comments/[commentId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/comment";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ลบคอมเมนต์ (hard delete - ลบออกจากฐานข้อมูลเลย)
export async function DELETE(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนลบความคิดเห็น" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ค้นหาคอมเมนต์ด้วย ID
    const comment = await Comment.findById(params.commentId);
    
    if (!comment) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบความคิดเห็นที่ต้องการลบ" 
      }, { status: 404 });
    }

    // ตรวจสอบว่าเป็นเจ้าของคอมเมนต์หรือไม่
    if (comment.user_bkc_id !== session.user.bkcId) {
      return NextResponse.json({ 
        success: false, 
        message: "คุณไม่มีสิทธิ์ลบความคิดเห็นนี้" 
      }, { status: 403 });
    }
    
    // ทำ soft delete และกำหนดวันที่จะลบถาวรใน 7 วัน
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // เพิ่ม 7 วัน
    
    const updatedComment = await Comment.findByIdAndUpdate(
      params.commentId,
      {
        is_deleted: true,
        expireAt: expiryDate
      },
      { new: true }
    );
    
    if (!updatedComment) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่สามารถลบความคิดเห็นได้" 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "ลบความคิดเห็นสำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการลบความคิดเห็น"
    }, { status: 500 });
  }
}