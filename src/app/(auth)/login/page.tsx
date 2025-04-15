"use client";

import React from "react";
import { Button, Input, Link, Divider, Tooltip, Spinner, InputOtp } from "@heroui/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaArrowLeftLong } from "react-icons/fa6";
import { BsLine } from "react-icons/bs";
import Image from "next/image";
import { IoLogIn, IoMail } from "react-icons/io5";
import { Loading } from "@/components";

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
  const [error, setError] = React.useState("");
  const [connectionError, setConnectionError] = React.useState(false);

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  React.useEffect(() => {
    if (session) {
      if (session.user.isNewUser) {
        router.replace('/complete-profile');
      } else {
        router.replace('/welcome');
      }
    }
  }, [session, router]);

  // ตัวนับเวลาถอยหลังสำหรับการขอรหัส OTP ใหม่
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // เพิ่ม useEffect สำหรับการรีเซ็ตสถานะเมื่อโหลดหน้า Login ใหม่
  React.useEffect(() => {
    // รีเซ็ตค่าเริ่มต้น
    setPage([0, 0]);
    setEmail("");
    setOtp("");
    setIsEmailValid(true);
    setIsOtpValid(true);
    setIsLoading(false);
    setResendCooldown(0);
    setError("");

    // ตรวจสอบว่ามีข้อมูลการล็อกอินที่บันทึกไว้หรือไม่
    const checkSavedLoginState = async () => {
      // ถ้าอยู่ในโปรเซสล็อกอินอยู่แล้ว ให้เช็คว่ามี session หรือไม่
      if (status === "authenticated" && session) {
        if (session.user.isNewUser) {
          router.replace('/complete-profile');
        } else {
          router.replace('/welcome');
        }
      }
    };

    checkSavedLoginState();

    // Cleanup เมื่อ unmount
    return () => {
      // ยกเลิก timer หรือ subscription ต่างๆ ที่อาจมี
    };
  }, [router, session, status]);

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
    }
  };

  // แก้ไขฟังก์ชัน handleEmailSubmit
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.length || !/^\S+@\S+\.\S+$/.test(email)) {
      setIsEmailValid(false);
      return;
    }

    setIsEmailValid(true);
    setIsLoading(true);
    setConnectionError(false);

    try {
      // ส่งรหัส OTP
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        // เริ่มนับถอยหลังการขอรหัส OTP ใหม่
        setResendCooldown(60); // 60 วินาที

        // เปลี่ยนไปหน้ากรอก OTP
        paginate(1);
      } else {
        setIsEmailValid(false);
        setError(data.message || "ไม่สามารถส่งรหัส OTP ได้");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setIsEmailValid(false);
      setConnectionError(true);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // เพิ่มฟังก์ชันตรวจสอบความถูกต้องของ OTP
  const validateOtp = (otpCode: string): boolean => {
    // ตรวจสอบว่า OTP มีเฉพาะตัวเลขเท่านั้น
    const digitPattern = /^\d+$/;
    // ตรวจสอบความยาว 6 หลักและมีเฉพาะตัวเลข
    return otpCode.length === 6 && digitPattern.test(otpCode);
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateOtp(otp)) {
      setIsOtpValid(false);
      setError("รหัส OTP ต้องเป็นตัวเลข 6 หลักเท่านั้น");
      return;
    }

    if (!otp.length || otp.length !== 6) {
      setIsOtpValid(false);
      return;
    }

    setIsOtpValid(true);
    setIsLoading(true);

    try {
      // ดำเนินการเข้าสู่ระบบ
      const result = await signIn("otp", {
        email,
        otp,
        redirect: false
      });

      if (result?.error) {
        setIsOtpValid(false);
        // รีเซ็ตค่า OTP เพื่อให้ผู้ใช้กรอกใหม่
        setOtp("");
        setError("รหัส OTP ไม่ถูกต้องหรือหมดอายุ โปรดลองใหม่");
      } else if (result?.ok) {
        // หากเข้าสู่ระบบสำเร็จ ให้เปลี่ยนเส้นทางไปยังหน้า welcome
        router.replace("/welcome");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setIsOtpValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineLogin = () => {
    signIn("line", { callbackUrl: "/welcome" });
  };

  // ฟังก์ชันสำหรับการขอรหัส OTP ใหม่
  const handleResendOtp = async () => {
    // ตรวจสอบว่าหมดเวลาการรอแล้ว
    if (resendCooldown > 0) return;

    setIsLoading(true);

    try {
      // ส่งรหัส OTP ใหม่
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        // เริ่มนับถอยหลังใหม่
        setResendCooldown(60); // 60 วินาที

        // รีเซ็ตค่า OTP เดิม
        setOtp("");
      } else {
        // กรณีมีข้อผิดพลาด
        console.error("ไม่สามารถส่งรหัส OTP ใหม่ได้");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = page === 0 ? handleEmailSubmit : handleOtpSubmit;

  // แสดงหน้า loading เมื่อกำลังตรวจสอบ session
  if (status === "loading") {
    return (
      <Loading message='กำลังโหลดข้อมูล...' fullScreen={true} size="lg" />
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

        {connectionError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณและลองอีกครั้ง
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

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
                  }}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    รหัส OTP ถูกส่งไปยัง <span className="font-semibold">{email}</span>
                  </p>
                  {!isOtpValid && (
                    <p className="text-danger text-tiny mt-1">กรุณากรอกรหัส OTP ให้ถูกต้อง</p>
                  )}
                  <InputOtp
                    length={6}
                    value={otp}
                    variant="bordered"
                    onValueChange={(value) => {
                      setOtp(value);
                      setIsOtpValid(validateOtp(value) || value.length < 6);
                    }}
                    isInvalid={!isOtpValid}
                    errorMessage={!isOtpValid ? "รหัส OTP ไม่ถูกต้อง" : undefined}
                    classNames={{
                      helperWrapper: "flex justify-center items-center",
                      errorMessage: !isOtpValid ? "text-danger text-tiny" : "hidden"
                    }}
                  />
                  <div className="flex flex-col items-center">
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
    </section >
  );
}