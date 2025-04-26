// src/lib/middleware/adminMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';

/**
 * Middleware ตรวจสอบสิทธิ์ Admin
 * @param handler ฟังก์ชัน handler ที่จะทำงานหลังจากตรวจสอบสิทธิ์แล้ว
 * @returns ฟังก์ชันที่ตรวจสอบสิทธิ์ก่อนเรียก handler
 */
export function withAdminAuth(handler: (req: NextRequest, context: {params: Record<string, string>}) => Promise<NextResponse>) {
  return async (req: NextRequest, context: {params: Record<string, string>}) => {
    try {
      // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json({
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ"
        }, { status: 401 });
      }

      await connectDB();
      
      // ตรวจสอบว่าผู้ใช้มีสิทธิ์ admin หรือไม่
      const user = await User.findOne({ bkc_id: session.user.bkcId });
      
      if (!user) {
        return NextResponse.json({
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้"
        }, { status: 404 });
      }
      
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        return NextResponse.json({
          success: false,
          message: "คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้"
        }, { status: 403 });
      }
      
      // ถ้ามีสิทธิ์ admin ให้ดำเนินการต่อ
      return handler(req, context);
      
    } catch (error) {
      console.error("Admin middleware error:", error);
      return NextResponse.json({
        success: false,
        message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์",
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  };
}

/**
 * Middleware ตรวจสอบสิทธิ์ Super Admin
 * @param handler ฟังก์ชัน handler ที่จะทำงานหลังจากตรวจสอบสิทธิ์แล้ว
 * @returns ฟังก์ชันที่ตรวจสอบสิทธิ์ก่อนเรียก handler
 */
export function withSuperAdminAuth(handler: (req: NextRequest, context: {params: Record<string, string>}) => Promise<NextResponse>) {
  return async (req: NextRequest, context: {params: Record<string, string>}) => {
    try {
      // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json({
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ"
        }, { status: 401 });
      }

      await connectDB();
      
      // ตรวจสอบว่าผู้ใช้มีสิทธิ์ super admin หรือไม่
      const user = await User.findOne({ bkc_id: session.user.bkcId });
      
      if (!user) {
        return NextResponse.json({
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้"
        }, { status: 404 });
      }
      
      if (user.role !== 'superadmin') {
        return NextResponse.json({
          success: false,
          message: "คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้ (ต้องเป็น Super Admin เท่านั้น)"
        }, { status: 403 });
      }
      
      // ถ้ามีสิทธิ์ super admin ให้ดำเนินการต่อ
      return handler(req, context);
      
    } catch (error) {
      console.error("Super Admin middleware error:", error);
      return NextResponse.json({
        success: false,
        message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์",
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  };
}