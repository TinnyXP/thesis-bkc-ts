import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import OTP from "@/models/otp";
import { generateOTP, sendOTPEmail } from "@/lib/otpService";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    await connectDB();

    // สร้างรหัส OTP
    const otpCode = generateOTP(6);

    // กำหนดเวลาหมดอายุ (10 นาที)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // เก็บ OTP ลงฐานข้อมูล
    await OTP.create({
      email,
      otp_code: otpCode,
      expires_at: expiresAt
    });

    // ส่ง OTP ทางอีเมล (แก้ไขจาก sendOTPEmail เป็น sendOTPEmail)
    await sendOTPEmail(email, otpCode);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({
      success: false,
      message: "An error occurred while sending OTP",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}