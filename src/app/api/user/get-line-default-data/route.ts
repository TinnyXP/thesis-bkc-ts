// src/app/api/user/get-line-default-data/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";

export async function POST(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ" 
      }, { status: 401 });
    }
    
    // ดึง bkc_id จาก request หรือ session
    let bkcId = '';
    try {
      const body = await request.json();
      bkcId = body.bkcId || '';
    } catch (error) {
      console.log("Could not parse request body", error);
    }
    
    // ใช้ bkc_id จาก session ถ้าไม่มีใน request
    const userBkcId = bkcId || session.user.bkcId;
    
    if (!userBkcId) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่สามารถระบุตัวตนของผู้ใช้ได้" 
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ค้นหาผู้ใช้ด้วย bkc_id
    const user = await UserModel.findOne({ bkc_id: userBkcId });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบบัญชีผู้ใช้" 
      }, { status: 404 });
    }

    // ตรวจสอบว่ามีข้อมูล LINE หรือไม่
    if (!user.line_default_data || !user.line_default_data.name) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูล LINE ดั้งเดิม" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "ดึงข้อมูลจาก LINE สำเร็จ",
      lineDefaultData: user.line_default_data
    });
    
  } catch (error) {
    console.error("Error getting LINE default data:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลจาก LINE",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}