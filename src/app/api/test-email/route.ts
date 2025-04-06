import { NextResponse } from "next/server";
import { generateOTP, sendOTPEmail } from "@/lib/otpService";

export async function GET() {
  try {
    const testEmail = "trin.pongsri@gmail.com"; // ใส่อีเมลที่ต้องการทดสอบ
    const otpCode = generateOTP(6);
    
    await sendOTPEmail(testEmail, otpCode);
    
    return NextResponse.json({ 
      success: true, 
      message: `OTP sent to ${testEmail}`,
      otp: otpCode // แสดงเฉพาะตอนทดสอบ ไม่ควรส่งกลับในโปรดักชัน
    });
  } catch (error) {
    console.error("Error testing email:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to send test email" 
    }, { status: 500 });
  }
}