// src/app/api/reviews/[reviewId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/review";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ลบรีวิว (soft delete - ตั้งค่า is_deleted เป็น true)
export async function DELETE(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนลบรีวิว" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ค้นหารีวิวด้วย ID
    const review = await Review.findById(params.reviewId);
    
    if (!review) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบรีวิวที่ต้องการลบ" 
      }, { status: 404 });
    }

    // ตรวจสอบว่าเป็นเจ้าของรีวิวหรือไม่
    if (review.user_bkc_id !== session.user.bkcId) {
      return NextResponse.json({ 
        success: false, 
        message: "คุณไม่มีสิทธิ์ลบรีวิวนี้" 
      }, { status: 403 });
    }
    
    // ทำ soft delete โดยอัปเดตค่า is_deleted เป็น true
    const updatedReview = await Review.findByIdAndUpdate(
      params.reviewId,
      { is_deleted: true },
      { new: true }
    );
    
    if (!updatedReview) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่สามารถลบรีวิวได้" 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "ลบรีวิวสำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการลบรีวิว"
    }, { status: 500 });
  }
}