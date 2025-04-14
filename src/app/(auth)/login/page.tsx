"use client";

import React, { useEffect } from "react";
import { Button, Input, Link, Divider, Tooltip, Spinner, InputOtp } from "@heroui/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { FaArrowLeftLong } from "react-icons/fa6";
import { BsLine } from "react-icons/bs";
import Image from "next/image";
import { IoLogIn, IoMail } from "react-icons/io5";
import { useMockAuth } from "@/lib/auth/mockAuthContext";

export default function LoginPage() {
  const { isAuthenticated, isLoading, error, loginWithEmail, verifyOtp, loginWithLine } = useMockAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [[page, direction], setPage] = React.useState([0, 0]);
  const [isEmailValid, setIsEmailValid] = React.useState(true);
  const [isOtpValid, setIsOtpValid] = React.useState(true);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [otpSent, setOtpSent] = React.useState(false);

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

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

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.length || !/^\S+@\S+\.\S+$/.test(email)) {
      setIsEmailValid(false);
      return;
    }

    setIsEmailValid(true);

    try {
      await loginWithEmail(email);
      setOtpSent(true);
      setResendCooldown(60);
      paginate(1);
    } catch (err) {
      setIsEmailValid(false);
      console.error("Error sending OTP:", err);
    }
  };

  const handleLineLogin = async () => {
    try {
      await loginWithLine();
      // การ redirect จะเกิดขึ้นโดยอัตโนมัติผ่าน effect
    } catch (err) {
      console.error("Failed to login with LINE:", err);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!otp.length || otp.length !== 6) {
      setIsOtpValid(false);
      return;
    }

    setIsOtpValid(true);

    try {
      await verifyOtp(otp);
      // การ redirect จะเกิดขึ้นโดยอัตโนมัติผ่าน effect
    } catch (err) {
      setIsOtpValid(false);
      console.error("Error verifying OTP:", err);
    }
  };

  // ฟังก์ชันสำหรับการขอรหัส OTP ใหม่
  const handleResendOtp = async () => {
    // ตรวจสอบว่าหมดเวลาการรอแล้ว
    if (resendCooldown > 0) return;

    try {
      await loginWithEmail(email);
      setResendCooldown(60);
    } catch (err) {
      console.error("Error resending OTP:", err);
    }
  };

  const handleSubmit = page === 0 ? handleEmailSubmit : handleOtpSubmit;

  // แสดงหน้า loading เมื่อกำลังตรวจสอบ session
  if (isLoading && isAuthenticated) {
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
                isLoading={isLoading}
                startContent={!isLoading && (page === 0 ? <IoMail size={20} /> : <IoLogIn size={20} />)}
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
            isLoading={isLoading}
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