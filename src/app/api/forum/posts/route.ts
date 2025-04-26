// src/app/api/forum/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ForumPost } from "@/models/forum";
import User from "@/models/user";

/**
 * ดึงรายการกระทู้ทั้งหมด
 * สามารถกรองด้วย category ได้
 */
export async function GET(request: NextRequest) {
  try {
    // ดึงพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    await connectDB();
    
    // สร้าง query filter
    const filter: Record<string, unknown> = { is_deleted: false };
    
    // กรองตาม category ถ้ามีการระบุ
    if (category) {
      filter.category = category;
    }
    
    // นับจำนวนทั้งหมด
    const total = await ForumPost.countDocuments(filter);
    
    // ดึงข้อมูลกระทู้ โดยเรียงตามการปักหมุดและวันที่สร้าง
    const posts = await ForumPost.find(filter)
      .sort({ is_pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({ 
      success: true, 
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
    
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลกระทู้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * สร้างกระทู้ใหม่
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนสร้างกระทู้" 
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
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // แปลง tags จาก string เป็น array (ถ้ามี)
    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim())) : [];
    
    // สร้างกระทู้ใหม่
    const newPost = await ForumPost.create({
      title,
      content,
      user_bkc_id: user.bkc_id,
      user_name: user.name,
      user_image: user.profile_image,
      category,
      tags: tagsArray,
      view_count: 0,
      is_pinned: false,
      is_deleted: false
    });
    
    return NextResponse.json({
      success: true,
      message: "สร้างกระทู้สำเร็จ",
      post: newPost
    });
    
  } catch (error) {
    console.error("Error creating forum post:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างกระทู้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}