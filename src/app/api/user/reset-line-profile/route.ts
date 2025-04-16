// src/app/api/user/reset-line-profile/route.ts
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

    // ล็อกข้อมูล session เพื่อตรวจสอบ
    console.log("Session data:", JSON.stringify(session, null, 2));
    
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

    // ค้นหาผู้ใช้ด้วย bkc_id โดยไม่ตรวจสอบ provider
    const user = await UserModel.findOne({ bkc_id: userBkcId });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบบัญชีผู้ใช้" 
      }, { status: 404 });
    }

    // ข้ามการตรวจสอบ provider และตรวจสอบแค่ว่ามี line_default_data หรือไม่
    if (!user.line_default_data || !user.line_default_data.name) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูล LINE ดั้งเดิม" 
      }, { status: 400 });
    }

    // ถ้าถึงจุดนี้แล้ว แสดงว่าน่าจะเป็นบัญชี LINE แน่นอน (เพราะมี line_default_data)
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        name: user.line_default_data.name,
        profile_image: user.line_default_data.profile_image,
        profile_completed: false
      },
      { new: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: "รีเซ็ตข้อมูลกลับเป็นข้อมูลจาก LINE สำเร็จ",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        image: updatedUser.profile_image,
        bkcId: updatedUser.bkc_id
      }
    });
  } catch (error) {
    console.error("Error resetting LINE profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการรีเซ็ตข้อมูลจาก LINE",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}