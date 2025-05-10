// src/app/api/bookmarks/[postId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bookmark from "@/models/bookmark";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ตรวจสอบว่าผู้ใช้ได้บุ๊คมาร์กบทความนี้หรือไม่
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบ",
        isBookmarked: false
      }, { status: 401 });
    }

    await connectDB();
    
    // ใช้ bkcId แทน id
    const bookmark = await Bookmark.findOne({ 
      user_bkc_id: session.user.bkcId,
      post_id: params.postId
    });
    
    return NextResponse.json({ 
      success: true, 
      isBookmarked: !!bookmark,
      bookmarkId: bookmark?._id || null
    });
  } catch (error) {
    console.error("Error checking bookmark:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการตรวจสอบบุ๊คมาร์ก",
      isBookmarked: false
    }, { status: 500 });
  }
}

// ลบ Bookmark
export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบ" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ใช้ bkcId แทน id
    const result = await Bookmark.findOneAndDelete({ 
      user_bkc_id: session.user.bkcId,
      post_id: params.postId
    });
    
    if (!result) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบบุ๊คมาร์กนี้" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "ลบบุ๊คมาร์กสำเร็จ"
    });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการลบบุ๊คมาร์ก"
    }, { status: 500 });
  }
}