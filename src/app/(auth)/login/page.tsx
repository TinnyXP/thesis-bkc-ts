"use client"

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaLine } from "react-icons/fa";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // โหลดสถานะที่เก็บไว้ใน localStorage เมื่อหน้าเว็บโหลด
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('loginEmail');
      const otpSentStatus = localStorage.getItem('otpSent');
      
      if (savedEmail) {
        setEmail(savedEmail);
      }
      
      if (otpSentStatus === 'true') {
        setIsOtpSent(true);
        // ถ้ามีการเก็บเวลา countdown ไว้ ก็โหลดมาใช้
        const savedCountdown = localStorage.getItem('otpCountdown');
        if (savedCountdown) {
          const timeLeft = Math.max(0, parseInt(savedCountdown) - 
            Math.floor((Date.now() - parseInt(localStorage.getItem('otpTimestamp') || '0')) / 1000));
          setCountdown(timeLeft);
        }
      }
    }
  }, []);
  
  useEffect(() => {
    if (session) {
      if (session.user.isNewUser) {
        router.replace('/complete-profile');
      } else {
        router.replace('/welcome');
      }
    }
  }, [session, router]);

  // จัดการ countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          const newValue = prev - 1;
          // เก็บค่า countdown ใน localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('otpCountdown', newValue.toString());
          }
          return newValue;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันการรีโหลดหน้า
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        // เก็บข้อมูลใน localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('loginEmail', email);
          localStorage.setItem('otpSent', 'true');
          localStorage.setItem('otpTimestamp', Date.now().toString());
          localStorage.setItem('otpCountdown', '60');
        }
        
        setIsOtpSent(true);
        setCountdown(60);
        console.log("OTP sent successfully, state updated:", { isOtpSent: true });
      } else {
        setError(data.message || "ไม่สามารถส่งรหัส OTP ได้");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError("เกิดข้อผิดพลาดในการส่งรหัส OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันการรีโหลดหน้า
    
    if (!otp) {
      setError("กรุณากรอกรหัส OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("otp", {
        email,
        otp,
        redirect: false
      });

      if (result?.error) {
        setError("รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
      } else if (result?.ok) {
        // ลบข้อมูลใน localStorage เมื่อเข้าสู่ระบบสำเร็จ
        if (typeof window !== 'undefined') {
          localStorage.removeItem('loginEmail');
          localStorage.removeItem('otpSent');
          localStorage.removeItem('otpTimestamp');
          localStorage.removeItem('otpCountdown');
        }
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError("เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineLogin = () => {
    signIn("line", { callbackUrl: "/welcome" });
  };

  const handleResendOTP = () => {
    // รีเซ็ตสถานะเพื่อขอ OTP ใหม่
    setIsOtpSent(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('otpSent');
    }
    // เรียกฟังก์ชันส่ง OTP อีกครั้ง
    handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
  };

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">กำลังโหลด...</div>;
  }

  console.log("Current state:", { isOtpSent, email, countdown });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-4 p-6">
          <Image
            src="/Bkj_logo.svg"
            alt="Bangkrachao Logo"
            width={120}
            height={60}
            className="mb-2"
          />
          <h1 className="text-2xl font-bold text-center">เข้าสู่ระบบ</h1>
        </CardHeader>
        
        <Divider />
        
        <CardBody className="p-6">
          {/* LINE Login Button */}
          <div className="mb-6">
            <Button
              onClick={handleLineLogin}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              startContent={<FaLine size={20} />}
              size="lg"
            >
              เข้าสู่ระบบด้วย LINE
            </Button>
          </div>
          
          <div className="relative my-6">
            <Divider />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-3">
              หรือ
            </div>
          </div>
          
          {/* OTP Login Form */}
          <div>
            <h2 className="text-lg font-semibold mb-4">เข้าสู่ระบบด้วยอีเมล</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {!isOtpSent ? (
              <Form onSubmit={handleSendOTP} className="space-y-4">
                <Input
                  type="email"
                  label="อีเมล"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="กรอกอีเมลของคุณ"
                  isRequired
                  fullWidth
                />
                <Button 
                  type="submit" 
                  color="primary" 
                  isLoading={isLoading}
                  fullWidth
                >
                  ส่งรหัส OTP
                </Button>
              </Form>
            ) : (
              <Form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    รหัส OTP ถูกส่งไปยัง {email}
                  </p>
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ขอรหัสใหม่ได้ในอีก {countdown} วินาที
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-sm text-primary-color hover:underline"
                      disabled={isLoading}
                    >
                      ส่งรหัส OTP อีกครั้ง
                    </button>
                  )}
                </div>
                
                <Input
                  type="text"
                  label="รหัส OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="กรอกรหัส OTP 6 หลัก"
                  isRequired
                  fullWidth
                />
                
                <Button 
                  type="submit" 
                  color="primary" 
                  isLoading={isLoading}
                  fullWidth
                >
                  ยืนยันรหัส OTP
                </Button>
              </Form>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}