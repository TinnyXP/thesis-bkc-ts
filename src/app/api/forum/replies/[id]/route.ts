// src/app/api/forum/replies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ForumPost, ForumReply } from "@/models/forum";
import User from "@/models/user";

/**
 * แก้ไขการตอบกลับ
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
        message: "กรุณาเข้าสู่ระบบก่อนแก้ไขการตอบกลับ" 
      }, { status: 401 });
    }

    const { content } = await request.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!content || content.trim() === "") {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกเนื้อหาการตอบกลับ"
      }, { status: 400 });
    }

    await connectDB();
    
    // ดึงข้อมูลการตอบกลับ
    const reply = await ForumReply.findById(params.id);
    
    if (!reply) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบการตอบกลับที่ต้องการ"
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าเป็นเจ้าของการตอบกลับหรือไม่
    if (reply.user_bkc_id !== session.user.bkcId) {
      // ตรวจสอบว่าเป็น admin หรือไม่
      const user = await User.findOne({ bkc_id: session.user.bkcId });
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return NextResponse.json({
          success: false,
          message: "คุณไม่มีสิทธิ์ในการแก้ไขการตอบกลับนี้"
        }, { status: 403 });
      }
    }
    
    // อัปเดตข้อมูลการตอบกลับ
    reply.content = content;
    await reply.save();
    
    return NextResponse.json({
      success: true,
      message: "แก้ไขการตอบกลับสำเร็จ",
      reply
    });
    
  } catch (error) {
    console.error("Error updating forum reply:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการแก้ไขการตอบกลับ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * ลบการตอบกลับ (soft delete)
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
        message: "กรุณาเข้าสู่ระบบก่อนลบการตอบกลับ" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ดึงข้อมูลการตอบกลับ
    const reply = await ForumReply.findById(params.id);
    
    if (!reply) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบการตอบกลับที่ต้องการ"
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าเป็นเจ้าของการตอบกลับหรือไม่
    if (reply.user_bkc_id !== session.user.bkcId) {
      // ตรวจสอบว่าเป็น admin หรือไม่
      const user = await User.findOne({ bkc_id: session.user.bkcId });
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return NextResponse.json({
          success: false,
          message: "คุณไม่มีสิทธิ์ในการลบการตอบกลับนี้"
        }, { status: 403 });
      }
    }
    
    // ทำ soft delete และตั้งเวลาลบจริง
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // เก็บไว้ 30 วันก่อนลบจริง
    
    reply.is_deleted = true;
    reply.expireAt = expiryDate;
    await reply.save();
    
    return NextResponse.json({
      success: true,
      message: "ลบการตอบกลับเรียบร้อยแล้ว"
    });
    
  } catch (error) {
    console.error("Error deleting forum reply:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบการตอบกลับ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * ทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง (สำหรับเจ้าของกระทู้หรือ admin เท่านั้น)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง" 
      }, { status: 401 });
    }
    
    const { is_solution } = await request.json();
    
    if (typeof is_solution !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาระบุ is_solution เป็น true หรือ false"
      }, { status: 400 });
    }
    
    await connectDB();
    
    // ดึงข้อมูลการตอบกลับ
    const reply = await ForumReply.findById(params.id);
    
    if (!reply) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบการตอบกลับที่ต้องการ"
      }, { status: 404 });
    }
    
    // ดึงข้อมูลกระทู้
    const post = await ForumPost.findById(reply.post_id);
    
    if (!post) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบกระทู้ที่เกี่ยวข้อง"
      }, { status: 404 });
    }
    
    // ตรวจสอบว่าเป็นเจ้าของกระทู้หรือไม่
    if (post.user_bkc_id !== session.user.bkcId) {
      // ตรวจสอบว่าเป็น admin หรือไม่
      const user = await User.findOne({ bkc_id: session.user.bkcId });
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return NextResponse.json({
          success: false,
          message: "คุณไม่มีสิทธิ์ในการทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง"
        }, { status: 403 });
      }
    }
    
    // ถ้าตั้งเป็นคำตอบที่ถูกต้อง ให้ยกเลิกการเป็นคำตอบที่ถูกต้องของการตอบกลับอื่นๆ ในกระทู้เดียวกัน
    if (is_solution) {
      await ForumReply.updateMany(
        { post_id: reply.post_id, is_solution: true, _id: { $ne: reply._id } },
        { is_solution: false }
      );
    }
    
    // อัปเดตสถานะการเป็นคำตอบที่ถูกต้อง
    reply.is_solution = is_solution;
    await reply.save();
    
    return NextResponse.json({
      success: true,
      message: is_solution 
        ? "ทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้องเรียบร้อยแล้ว" 
        : "ยกเลิกการทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้องเรียบร้อยแล้ว",
      reply
    });
    
  } catch (error) {
    console.error("Error marking as solution:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}