// src/app/api/bookmarks/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bookmark from "@/models/bookmark";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ดึงรายการ Bookmarks ทั้งหมดของผู้ใช้
export async function GET() {
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
    const bookmarks = await Bookmark.find({ 
      user_bkc_id: session.user.bkcId 
    }).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      bookmarks
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลบุ๊คมาร์ก"
    }, { status: 500 });
  }
}

// เพิ่ม Bookmark ใหม่
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบ" 
      }, { status: 401 });
    }

    await connectDB();
    
    const { 
      post_id, 
      post_title, 
      post_slug, 
      post_category, 
      post_image 
    } = await request.json();
    
    if (!post_id || !post_title || !post_slug) {
      return NextResponse.json({ 
        success: false, 
        message: "ข้อมูลไม่ครบถ้วน" 
      }, { status: 400 });
    }
    
    // ตรวจสอบว่ามีบุ๊คมาร์กอยู่แล้วหรือไม่
    const existingBookmark = await Bookmark.findOne({
      user_bkc_id: session.user.bkcId,
      post_id
    });
    
    if (existingBookmark) {
      return NextResponse.json({ 
        success: false, 
        message: "คุณได้บุ๊คมาร์กบทความนี้ไว้แล้ว" 
      }, { status: 400 });
    }
    
    // สร้างบุ๊คมาร์กใหม่โดยใช้ bkcId แทน id
    const newBookmark = await Bookmark.create({
      user_bkc_id: session.user.bkcId,
      post_id,
      post_title,
      post_slug,
      post_category,
      post_image
    });
    
    return NextResponse.json({ 
      success: true, 
      bookmark: newBookmark
    });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการเพิ่มบุ๊คมาร์ก"
    }, { status: 500 });
  }
}