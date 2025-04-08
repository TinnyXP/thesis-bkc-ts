"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, CardBody, CardHeader, Divider, InputOtp, Tooltip } from "@heroui/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaLine } from "react-icons/fa";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { FaAngleLeft } from "react-icons/fa6";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);
  const [isEmailValid, setIsEmailValid] = useState(true);

  // โหลดสถานะที่เก็บไว้ใน localStorage เมื่อหน้าเว็บโหลด
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('loginEmail');
      const otpSentStatus = localStorage.getItem('otpSent');

      if (savedEmail) {
        setEmail(savedEmail);
      }

      if (otpSentStatus === 'true') {
        const savedCountdown = localStorage.getItem('otpCountdown');
        if (savedCountdown) {
          const timeLeft = Math.max(0, parseInt(savedCountdown) -
            Math.floor((Date.now() - parseInt(localStorage.getItem('otpTimestamp') || '0')) / 1000));
          setCountdown(timeLeft);
        }
        setPage([1, 1]); // ไปที่หน้า OTP ถ้ามีการส่ง OTP ไปแล้ว
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

  // เพิ่ม variants สำหรับ animation
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันการรีโหลดหน้า

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setIsEmailValid(false);
      setError("กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }

    setIsLoading(true);
    setError("");
    setIsEmailValid(true);

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

        setCountdown(60);
        // เปลี่ยนไปหน้า OTP
        paginate(1);
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

    if (!otp || otp.length !== 6) {
      setError("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('otpSent');
    }
    // เรียกฟังก์ชันส่ง OTP อีกครั้ง
    handleSendOTP({ preventDefault: () => { } } as React.FormEvent);
  };

  if (status === "loading") {
    return <LoadingState />;
  }

  return (
    <section className="font-[family-name:var(--font-line-seed-sans)]">
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-sm bg-white dark:bg-default-100/50 shadow-xl">
          <CardHeader className="flex flex-col items-center gap-4 p-6">
            <Image
              src="/Bkj_logo.svg"
              alt="Bangkrachoa Logo"
              width={120}
              height={60}
              className="mb-2"
            />
            <LazyMotion features={domAnimation}>
              <m.div layout className="flex min-h-[40px] items-center gap-2 pb-2">
                {page === 1 && (
                  <m.div>
                    <Tooltip content="กลับไปหน้าก่อนหน้า" delay={1000}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() => paginate(-1)}
                      >
                        <FaAngleLeft />
                      </Button>
                    </Tooltip>
                  </m.div>
                )}
                <m.h1 layout className="text-xl font-bold" transition={{ duration: 0.25 }}>
                  เข้าสู่ระบบ
                </m.h1>
              </m.div>
            </LazyMotion>
          </CardHeader>

          <CardBody className="p-6">
            {error && <ErrorMessage message={error} />}

            <LazyMotion features={domAnimation}>
              <AnimatePresence custom={direction} initial={false} mode="wait">
                <m.div
                  key={page}
                  animate="center"
                  custom={direction}
                  exit="exit"
                  initial="enter"
                  transition={{
                    duration: 0.25,
                  }}
                  variants={variants}
                >
                  {page === 0 ? (
                    <EmailStep
                      email={email}
                      setEmail={setEmail}
                      handleSendOTP={handleSendOTP}
                      isEmailValid={isEmailValid}
                      isLoading={isLoading}
                      handleLineLogin={handleLineLogin}
                    />
                  ) : (
                    <OtpStep
                      email={email}
                      otp={otp}
                      setOtp={setOtp}
                      countdown={countdown}
                      handleResendOTP={handleResendOTP}
                      handleVerifyOTP={handleVerifyOTP}
                      isLoading={isLoading}
                    />
                  )}
                </m.div>
              </AnimatePresence>
            </LazyMotion>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

// คอมโพเนนต์ย่อย

// แสดงข้อความแจ้งเตือนความผิดพลาด
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
    {message}
  </div>
);

// ขั้นตอนกรอกอีเมล
const EmailStep = ({
  email,
  setEmail,
  handleSendOTP,
  isEmailValid,
  isLoading,
  handleLineLogin
}: {
  email: string;
  setEmail: (email: string) => void;
  handleSendOTP: (e: React.FormEvent) => Promise<void>;
  isEmailValid: boolean;
  isLoading: boolean;
  handleLineLogin: () => void;
}) => (
  <div className="flex flex-col gap-4">
    <Form onSubmit={handleSendOTP} className="space-y-4">
      <Input
        type="email"
        label="ที่อยู่อีเมล"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        isRequired
        isInvalid={!isEmailValid}
        errorMessage={!isEmailValid ? "กรุณากรอกอีเมลที่ถูกต้อง" : undefined}
        variant="bordered"
      />
      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        fullWidth
      >
        ดำเนินการต่อด้วยอีเมล
      </Button>
    </Form>

    <div className="flex items-center gap-4 py-2">
      <Divider className="flex-1" />
      <p className="shrink-0 text-tiny text-default-500">หรือ</p>
      <Divider className="flex-1" />
    </div>

    <Button
      onClick={handleLineLogin}
      className="bg-green-500 hover:bg-green-600 text-white"
      startContent={<FaLine size={20} />}
      fullWidth
    >
      เข้าสู่ระบบด้วย LINE
    </Button>
  </div>
);

// ขั้นตอนกรอก OTP
const OtpStep = ({
  email,
  otp,
  setOtp,
  countdown,
  handleResendOTP,
  handleVerifyOTP,
  isLoading
}: {
  email: string;
  otp: string;
  setOtp: (otp: string) => void;
  countdown: number;
  handleResendOTP: () => void;
  handleVerifyOTP: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}) => (
  <div className="flex flex-col gap-4">
    <div className="mb-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        รหัส OTP ถูกส่งไปยัง <span className="font-semibold">{email}</span>
      </p>
      {countdown > 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          ขอรหัสใหม่ได้ในอีก {countdown} วินาที
        </p>
      ) : (
        <button
          type="button"
          onClick={handleResendOTP}
          className="text-xs text-primary-color hover:underline mt-1"
          disabled={isLoading}
        >
          ส่งรหัส OTP อีกครั้ง
        </button>
      )}
    </div>

    <Form onSubmit={handleVerifyOTP} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">รหัส OTP</label>
        <InputOtp
          isRequired
          aria-label="รหัส OTP"
          length={6}
          value={otp}
          onValueChange={setOtp}
          classNames={{
            base: "w-full justify-center",
            input: "text-center text-lg font-semibold"
          }}
        />
        <p className="text-xs text-gray-500 mt-1 text-center">กรุณากรอกรหัส 6 หลักที่ส่งไปยังอีเมลของคุณ</p>
      </div>

      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        fullWidth
      >
        ยืนยันรหัส OTP
      </Button>
    </Form>
  </div>
);

// สถานะกำลังโหลด
const LoadingState = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
    <span className="ml-3">กำลังโหลด...</span>
  </div>
);