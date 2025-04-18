// src/app/api/comments/post/[postId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/comment";
import User from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ดึงคอมเมนต์ทั้งหมดของบทความ
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    // ดึงค่า pagination จาก query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // คำนวณตำแหน่งเริ่มต้น
    const skip = (page - 1) * limit;
    
    await connectDB();
    
    // คำนวณจำนวนคอมเมนต์หลักทั้งหมด (ไม่รวมคอมเมนต์ตอบกลับ)
    const totalComments = await Comment.countDocuments({ 
      post_id: params.postId,
      is_deleted: false,
      parent_id: null // นับเฉพาะคอมเมนต์หลัก
    });
    
    // ดึงคอมเมนต์หลักตามหน้าที่ต้องการ
    const mainComments = await Comment.find({ 
      post_id: params.postId,
      is_deleted: false,
      parent_id: null // เฉพาะคอมเมนต์หลัก
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    // ดึง ID ของคอมเมนต์หลักทั้งหมดที่ดึงมา
    const mainCommentIds = mainComments.map(comment => comment._id.toString());
    
    // ดึงคอมเมนต์ที่ตอบกลับคอมเมนต์หลักที่ดึงมา
    const replies = await Comment.find({
      post_id: params.postId,
      is_deleted: false,
      parent_id: { $in: mainCommentIds }
    }).sort({ createdAt: 1 });
    
    // รวมคอมเมนต์ทั้งหมด
    const allComments = [...mainComments, ...replies];
    
    // ดึงข้อมูลผู้ใช้ล่าสุดสำหรับแต่ละคอมเมนต์
    const updatedComments = await Promise.all(allComments.map(async (comment) => {
      const commentObj = comment.toObject();
      
      try {
        // ดึงข้อมูลผู้ใช้ล่าสุดโดยใช้ user_bkc_id
        const user = await User.findOne({ bkc_id: commentObj.user_bkc_id });
        
        // ถ้าพบข้อมูลผู้ใช้ ให้อัปเดตชื่อและรูปภาพ
        if (user) {
          return {
            ...commentObj,
            user_name: user.name,  // ใช้ชื่อล่าสุด
            user_image: user.profile_image  // ใช้รูปล่าสุด
          };
        }
      } catch (error) {
        console.error(`Error fetching user data for comment ${commentObj._id}:`, error);
        // ถ้าเกิดข้อผิดพลาด ไม่ต้องอัพเดตข้อมูลผู้ใช้
      }
      
      // ถ้าไม่พบข้อมูลผู้ใช้หรือเกิดข้อผิดพลาด คืนค่าคอมเมนต์เดิม
      return commentObj;
    }));
    
    // ส่งข้อมูล pagination กลับไปด้วย
    return NextResponse.json({ 
      success: true, 
      comments: updatedComments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments: totalComments
      }
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