"use client";

import React, { useEffect } from "react";
import { Button, Input, Link, Divider, Tooltip, Spinner, InputOtp } from "@heroui/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaArrowLeftLong } from "react-icons/fa6";
import { BsLine } from "react-icons/bs";
import Image from "next/image";
import { IoLogIn, IoMail } from "react-icons/io5";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [[page, direction], setPage] = React.useState([0, 0]);
  const [isEmailValid, setIsEmailValid] = React.useState(true);
  const [isOtpValid, setIsOtpValid] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  React.useEffect(() => {
    console.log("Login: Session status check", {
      status,
      userId: session?.user?.id,
      isNewUser: session?.user?.isNewUser
    });

    if (status === "authenticated") {
      if (session.user.isNewUser) {
        // ถ้าเป็นผู้ใช้ใหม่ที่เข้าสู่ระบบด้วย OTP ให้ไปที่หน้าสร้างโปรไฟล์
        if (session.user.provider === 'otp') {
          console.log("Login: Redirecting to create-profile");
          router.replace('/create-profile');
        } else {
          // ถ้าเป็นผู้ใช้ใหม่ที่เข้าสู่ระบบด้วย LINE ให้ไปที่หน้าแรกเลย
          console.log("Login: New LINE user, redirecting to home");
          localStorage.setItem('firstLogin', 'true'); // ตั้งค่าเพื่อให้แสดง popup
          router.replace('/');
        }
      } else {
        // ถ้าไม่ใช่ผู้ใช้ใหม่ ให้ไปที่หน้าแรกเลย
        console.log("Login: Existing user, redirecting to home");
        router.replace('/');
      }
    } else if (status === "unauthenticated") {
      // โหลด email จาก localStorage เมื่อเริ่มต้น (เฉพาะเมื่อยังไม่ได้เข้าสู่ระบบ)
      const savedEmail = localStorage.getItem('loginEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }

      // ตรวจสอบสถานะ OTP
      const otpSentStatus = localStorage.getItem('otpSent');
      if (otpSentStatus === 'true') {
        const savedCountdown = localStorage.getItem('otpCountdown');
        if (savedCountdown) {
          const timeLeft = Math.max(0, parseInt(savedCountdown) -
            Math.floor((Date.now() - parseInt(localStorage.getItem('otpTimestamp') || '0')) / 1000));
          if (timeLeft > 0) {
            setResendCooldown(timeLeft);
            setPage([1, 1]);
          } else {
            // ถ้าหมดเวลาแล้ว ลบข้อมูล OTP ออก
            clearOtpLocalStorage();
          }
        }
      }
    }
  }, [session, status, router]);

  // ตัวนับเวลาถอยหลังสำหรับการขอรหัส OTP ใหม่
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => {
          const newValue = prev - 1;
          // เก็บค่า countdown ใน localStorage
          if (newValue > 0) {
            localStorage.setItem('otpCountdown', newValue.toString());
          } else {
            // ถ้าหมดเวลาแล้ว ลบข้อมูล OTP ออก
            clearOtpLocalStorage();
          }
          return newValue;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // ฟังก์ชันล้างข้อมูล OTP ใน localStorage
  const clearOtpLocalStorage = () => {
    localStorage.removeItem('otpSent');
    localStorage.removeItem('otpCountdown');
    localStorage.removeItem('otpTimestamp');
  };

  // const clearAllLoginLocalStorage = () => {
  //   clearOtpLocalStorage();
  //   localStorage.removeItem('loginEmail');
  // };

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
    // รีเซ็ตค่า OTP เมื่อกลับไปหน้าก่อนหน้า
    if (newDirection < 0) {
      setOtp("");
      setIsOtpValid(true);
      setError(null);
    }
  };

  // src/app/(auth)/login/page.tsx
  // สร้าง OTP Manager เป็น object เพื่อจัดการทุกอย่างเกี่ยวกับ OTP
  const OTPManager = {
    setOTPData: (email: string, countdown: number) => {
      const timestamp = Date.now();
      localStorage.setItem('loginEmail', email);
      localStorage.setItem('otpSent', 'true');
      localStorage.setItem('otpTimestamp', timestamp.toString());
      localStorage.setItem('otpCountdown', countdown.toString());
      return timestamp;
    },

    clearOTPData: () => {
      localStorage.removeItem('otpSent');
      localStorage.removeItem('otpCountdown');
      localStorage.removeItem('otpTimestamp');
    },

    clearAllLoginData: () => {
      localStorage.removeItem('loginEmail');
      localStorage.removeItem('otpSent');
      localStorage.removeItem('otpCountdown');
      localStorage.removeItem('otpTimestamp');
    },

    getTimeLeft: () => {
      const otpSent = localStorage.getItem('otpSent') === 'true';
      if (!otpSent) return 0;

      const countdown = parseInt(localStorage.getItem('otpCountdown') || '0');
      const timestamp = parseInt(localStorage.getItem('otpTimestamp') || '0');
      const now = Date.now();

      // คำนวณเวลาที่เหลือ
      const elapsed = Math.floor((now - timestamp) / 1000);
      return Math.max(0, countdown - elapsed);
    }
  };

  // ปรับปรุงฟังก์ชัน handleEmailSubmit ให้ใช้ OTPManager
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.length || !/^\S+@\S+\.\S+$/.test(email)) {
      setIsEmailValid(false);
      setError("กรุณากรอกรูปแบบอีเมลให้ถูกต้อง");
      return;
    }

    setIsEmailValid(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log("Login: Sending OTP to email", email);

      // ส่งรหัส OTP
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log("Login: OTP send response", { success: data.success });

      if (data.success) {
        // ใช้ OTPManager เพื่อจัดการข้อมูล OTP
        OTPManager.setOTPData(email, 60);
        setResendCooldown(60);

        // เปลี่ยนไปหน้ากรอก OTP
        paginate(1);
      } else {
        setIsEmailValid(false);
        setError(data.message || "ไม่สามารถส่งรหัส OTP ได้");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setIsEmailValid(false);
      setError("เกิดข้อผิดพลาดในการส่งรหัส OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // src/app/(auth)/login/page.tsx
  const handleLineLogin = async () => {
    try {
      console.log("Login: Initiating LINE login");
      // ล้างข้อมูล OTP ก่อนเข้าสู่ระบบด้วย LINE
      OTPManager.clearAllLoginData();

      // ตั้งค่า localStorage เพื่อให้แสดง popup เมื่อเข้าสู่ระบบสำเร็จครั้งแรก
      localStorage.setItem('firstLogin', 'true');

      // เพิ่มการตรวจจับกรณีไม่อนุญาตให้เข้าถึง
      localStorage.setItem('line_login_attempt', Date.now().toString());

      // เข้าสู่ระบบด้วย LINE
      await signIn("line", {
        callbackUrl: "/",
        redirect: true
      });
    } catch (error) {
      console.error("Failed to initiate LINE login:", error);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE กรุณาลองใหม่อีกครั้ง");
    }
  };

  // เพิ่ม useEffect เพื่อตรวจสอบการเชื่อมต่อ LINE
  useEffect(() => {
    const lineLoginAttempt = localStorage.getItem('line_login_attempt');
    if (lineLoginAttempt) {
      const attemptTime = parseInt(lineLoginAttempt);
      const now = Date.now();

      // ถ้าเพิ่งพยายามเข้าสู่ระบบด้วย LINE ไม่นาน (ภายใน 10 วินาที) แต่กลับมาที่หน้า login
      // แสดงว่าอาจมีปัญหา (ผู้ใช้ปฏิเสธการอนุญาตหรือการเชื่อมต่อมีปัญหา)
      if (now - attemptTime < 10000) {
        setError("การเข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }

      localStorage.removeItem('line_login_attempt');
    }
  }, []);

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!otp.length || otp.length !== 6) {
      setIsOtpValid(false);
      setError("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    setIsOtpValid(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log("Login: Verifying OTP", { email, otpLength: otp.length });

      // เพิ่ม timeout สำหรับกรณีเซิร์ฟเวอร์ไม่ตอบสนอง
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

      // ดำเนินการเข้าสู่ระบบพร้อมกับ signal สำหรับ timeout
      const result = await signIn("otp", {
        email,
        otp,
        redirect: false,
        callbackUrl: '/'
      });

      clearTimeout(timeoutId);

      console.log("Login: OTP verification result", {
        ok: result?.ok,
        error: result?.error,
        url: result?.url
      });

      if (result?.error) {
        // จำแนกประเภทข้อผิดพลาด
        if (result.error.includes("network") || result.error.includes("timeout")) {
          setError("การเชื่อมต่อล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่อีกครั้ง");
        } else if (result.error.includes("expired")) {
          setError("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่");
        } else {
          setError("รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
        }
        setIsOtpValid(false);
      } else if (result?.ok) {
        // ลบข้อมูลใน localStorage เมื่อเข้าสู่ระบบสำเร็จ
        OTPManager.clearAllLoginData();

        // ตั้งค่า localStorage สำหรับการแสดง popup ต้อนรับเมื่อเข้าสู่ระบบครั้งแรก
        localStorage.setItem('firstLogin', 'true');

        // การเข้าสู่ระบบสำเร็จ - router จะไปหน้าอื่นโดยอัตโนมัติจาก useEffect
        console.log("Login: OTP login successful, system will redirect to proper page");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      // จัดการกับ AbortError (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        setError("การเชื่อมต่อล่าช้าเกินไป กรุณาลองใหม่อีกครั้ง");
      } else {
        setError("เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP");
      }
      setIsOtpValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการขอรหัส OTP ใหม่
  const handleResendOtp = async () => {
    // ตรวจสอบว่าหมดเวลาการรอแล้ว
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Login: Resending OTP to email", email);

      // ส่งรหัส OTP ใหม่
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log("Login: Resend OTP response", { success: data.success });

      if (data.success) {
        // ตั้งค่า localStorage ใหม่
        localStorage.setItem('otpSent', 'true');
        localStorage.setItem('otpTimestamp', Date.now().toString());
        localStorage.setItem('otpCountdown', '60');

        // เริ่มนับถอยหลังใหม่
        setResendCooldown(60); // 60 วินาที

        // รีเซ็ตค่า OTP เดิม
        setOtp("");
        setIsOtpValid(true);
      } else {
        // กรณีมีข้อผิดพลาด
        setError(data.message || "ไม่สามารถส่งรหัส OTP ใหม่ได้");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setError("เกิดข้อผิดพลาดในการส่งรหัส OTP ใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = page === 0 ? handleEmailSubmit : handleOtpSubmit;

  // แสดงหน้า loading เมื่อกำลังตรวจสอบ session
  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Spinner
          classNames={{
            label: "text-foreground mt-4 font-[family-name:var(--font-line-seed-sans)]"
          }}
          variant="gradient"
          size="lg"
          label="กำลังตรวจสอบสถานะการเข้าสู่ระบบ..."
        />
      </div>
    );
  }

  return (
    <section className="font-[family-name:var(--font-line-seed-sans)] min-h-screen flex flex-col items-center justify-center mx-4">
      <Image
        src="/Bkj_logo.svg"
        alt="Bangkrachoa Logo"
        width={120}
        height={60}
        className="mb-4"
      />
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-large bg-content1 px-8 pb-6 pt-6 shadow-small">
        <LazyMotion features={domAnimation}>
          <m.div layout className="flex min-h-[40px] items-center gap-2 pb-2">
            {page === 1 && (
              <m.div>
                <Tooltip content="ย้อนกลับ" delay={1000}>
                  <Button isIconOnly size="sm" variant="flat" onPress={() => paginate(-1)}>
                    <FaArrowLeftLong />
                  </Button>
                </Tooltip>
              </m.div>
            )}
            <m.h1 layout className="text-xl font-bold" transition={{ duration: 0.25 }}>
              เข้าสู่ระบบ
            </m.h1>
          </m.div>

          {/* แสดงข้อความแจ้งเตือน */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
              {error}
            </div>
          )}

          <AnimatePresence custom={direction} initial={false} mode="wait">
            <m.form
              key={page}
              animate="center"
              className="flex flex-col gap-3"
              custom={direction}
              exit="exit"
              initial="enter"
              transition={{
                duration: 0.25,
              }}
              variants={variants}
              onSubmit={handleSubmit}
            >
              {page === 0 ? (
                <Input
                  errorMessage={!isEmailValid ? "กรุณากรอกรูปแบบอีเมลให้ถูกต้อง" : undefined}
                  isInvalid={!isEmailValid}
                  label="ที่อยู่อีเมล"
                  name="email"
                  type="email"
                  value={email}
                  variant="bordered"
                  onValueChange={(value) => {
                    setIsEmailValid(true);
                    setEmail(value);
                    setError(null);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    รหัส OTP ถูกส่งไปยัง <span className="font-semibold">{email}</span>
                  </p>
                  <InputOtp
                    length={6}
                    value={otp}
                    variant="bordered"
                    onValueChange={(value) => {
                      setOtp(value);
                      setIsOtpValid(true);
                      setError(null);
                    }}
                    isInvalid={!isOtpValid}
                    classNames={{
                      helperWrapper: "flex justify-center items-center",
                    }}
                  />
                  <div className="flex flex-col items-center mt-2">
                    {resendCooldown > 0 ? (
                      <p className="text-tiny text-default-500">
                        ขอรหัสใหม่ได้ในอีก {resendCooldown} วินาที
                      </p>
                    ) : (
                      <Link
                        size="sm"
                        color="primary"
                        onPress={handleResendOtp}
                        className="text-tiny"
                      >
                        ส่งรหัส OTP ใหม่อีกครั้ง
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <Button fullWidth color="primary" type="submit"
                className="font-bold"
                startContent={isLoading ? <Spinner size="sm" color="white" variant="gradient" /> : (page === 0 ? <IoMail size={20} /> : <IoLogIn size={20} />)}
              >
                {page === 0 ? "เข้าสู่ระบบผ่านอีเมล" : "ยืนยันรหัส OTP"}
              </Button>
            </m.form>
          </AnimatePresence>
        </LazyMotion>
        <div className="flex items-center gap-3 py-2">
          <Divider className="flex-1" />
          <p className="shrink-0 text-tiny text-default-500">หรือ</p>
          <Divider className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            startContent={<BsLine className="text-primary-color" size={20} />}
            variant="bordered"
            onPress={handleLineLogin}
            isLoading={isLoading && page === 0}
          >
            เข้าสู่ระบบผ่าน LINE
          </Button>
        </div>
        <p className="text-center text-tiny text-default-500 mt-1">
          การเข้าสู่ระบบถือว่าคุณยอมรับ
          <Link href="/privacy-policy" className="text-primary-color text-tiny mx-1 hover:underline">
            นโยบายความเป็นส่วนตัว
          </Link>
          <br />
          และ
          <Link href="/terms" className="text-primary-color text-tiny mx-1 hover:underline">
            เงื่อนไขการใช้งาน
          </Link>
        </p>
      </div>
    </section>
  );
}