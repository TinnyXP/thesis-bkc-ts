// src/app/api/complaints/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Complaint from "@/models/complaint";
import User from "@/models/user";
import { withAdminAuth } from "@/lib/middleware/adminMiddleware";

/**
 * ดึงข้อมูลเรื่องร้องเรียนรายการเดียว
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
    
    // แปลงข้อมูลก่อนส่งกลับ
    let responseData = complaint.toObject();
    
    // ถ้าเป็น anonymous และไม่ใช่เจ้าของหรือ admin ให้ซ่อนข้อมูลผู้ร้องเรียน
    if (complaint.is_anonymous && !isAdmin && complaint.user_bkc_id !== session.user.bkcId) {
      responseData = {
        ...responseData,
        user_name: "ไม่เปิดเผยตัวตน",
        user_image: null,
        user_bkc_id: null
      };
    }
    
    return NextResponse.json({
      success: true,
      complaint: responseData
    });
    
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลเรื่องร้องเรียน",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * อัปเดตสถานะเรื่องร้องเรียน (สำหรับ admin)
 */
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  context: { params: Record<string, string> }
) => {
  try {
    // const session = await getServerSession(authOptions);
    const { status } = await request.json();
    
    // ตรวจสอบความถูกต้องของ status
    if (!status || !['pending', 'inprogress', 'resolved', 'rejected'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: "สถานะไม่ถูกต้อง โปรดระบุสถานะเป็น 'pending', 'inprogress', 'resolved', หรือ 'rejected'"
      }, { status: 400 });
    }
    
    // ดึงข้อมูลเรื่องร้องเรียน
    const complaint = await Complaint.findById(context.params.id);
    
    if (!complaint) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบเรื่องร้องเรียนที่ต้องการ"
      }, { status: 404 });
    }
    
    // อัปเดตสถานะ
    complaint.status = status;
    await complaint.save();
    
    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะเรื่องร้องเรียนเป็น "${status}" เรียบร้อยแล้ว`,
      complaint
    });
    
  } catch (error) {
    console.error("Error updating complaint status:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะเรื่องร้องเรียน",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});

/**
 * ลบเรื่องร้องเรียน (soft delete)
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
    
    // ตรวจสอบสิทธิ์การลบ - admin ลบได้ทุกเรื่อง แต่ user ลบได้เฉพาะเรื่องของตัวเอง
    if (!isAdmin && complaint.user_bkc_id !== session.user.bkcId) {
      return NextResponse.json({
        success: false,
        message: "คุณไม่มีสิทธิ์ในการลบเรื่องร้องเรียนนี้"
      }, { status: 403 });
    }
    
    // ทำ soft delete และตั้งเวลาลบจริง
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // เก็บไว้ 30 วันก่อนลบจริง
    
    complaint.is_deleted = true;
    complaint.expireAt = expiryDate;
    await complaint.save();
    
    return NextResponse.json({
      success: true,
      message: "ลบเรื่องร้องเรียนเรียบร้อยแล้ว"
    });
    
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบเรื่องร้องเรียน",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}