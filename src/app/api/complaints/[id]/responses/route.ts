// src/app/api/complaints/[id]/responses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Complaint from "@/models/complaint";
import User from "@/models/user";
import { withAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * ดึงการตอบกลับทั้งหมดของเรื่องร้องเรียน
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
    
    // ดึงข้อมูลเรื่องร้องเรียน
    const complaint = await Complaint.findById(params.id);
    
    if (!complaint) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบเรื่องร้องเรียนที่ต้องการ"
      }, { status: 404 });
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง - admin ดูได้ทุกเรื่อง แต่ user ดูได้เฉพาะเรื่องของตัวเอง
    if (!isAdmin && complaint.user_bkc_id !== session.user.bkcId) {
      return NextResponse.json({
        success: false,
        message: "คุณไม่มีสิทธิ์ในการเข้าถึงเรื่องร้องเรียนนี้"
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      responses: complaint.responses
    });
    
  } catch (error) {
    console.error("Error fetching complaint responses:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลการตอบกลับ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * เพิ่มการตอบกลับใหม่ (สำหรับ admin เท่านั้น)
 */
export const POST = withAdminAuth(async (
  request: NextRequest,
  context: { params: Record<string, string> }
) => {
  try {
    const session = await getServerSession(authOptions);
    const { content } = await request.json();
    
    if (!content || content.trim() === "") {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกเนื้อหาการตอบกลับ"
      }, { status: 400 });
    }
    
    // ดึงข้อมูล admin
    const admin = await User.findOne({ bkc_id: session?.user.bkcId });
    
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return NextResponse.json({
        success: false,
        message: "คุณไม่มีสิทธิ์ในการตอบกลับเรื่องร้องเรียน"
      }, { status: 403 });
    }
    
    // ดึงข้อมูลเรื่องร้องเรียน
    const complaint = await Complaint.findById(context.params.id);
    
    if (!complaint) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบเรื่องร้องเรียนที่ต้องการ"
      }, { status: 404 });
    }
    
    // เพิ่มการตอบกลับใหม่
    complaint.responses.push({
      content,
      admin_id: admin.bkc_id,
      admin_name: admin.name,
      created_at: new Date()
    });
    
    // ถ้าสถานะยังเป็น pending ให้เปลี่ยนเป็น inprogress
    if (complaint.status === 'pending') {
      complaint.status = 'inprogress';
    }
    
    await complaint.save();
    
    return NextResponse.json({
      success: true,
      message: "เพิ่มการตอบกลับเรียบร้อยแล้ว",
      response: complaint.responses[complaint.responses.length - 1]
    });
    
  } catch (error) {
    console.error("Error adding complaint response:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มการตอบกลับ",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});