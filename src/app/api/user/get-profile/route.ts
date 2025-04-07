// src/app/api/user/get-profile/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET() {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }

    // ตรวจสอบว่า session.user.id ถูกต้องหรือไม่
    if (!session.user.id || session.user.id === "new-user" || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ 
        success: false, 
        message: "ต้องสร้างโปรไฟล์ให้เสร็จสมบูรณ์ก่อน" 
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // ดึงข้อมูลผู้ใช้
    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.profile_image,
        bio: user.bio || "",
        provider: user.provider
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}