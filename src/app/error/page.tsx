"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, CardBody, Link } from "@heroui/react";
import Image from "next/image";
import { FaExclamationTriangle, FaHome, FaSignInAlt } from "react-icons/fa";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorTitle, setErrorTitle] = useState<string>("เกิดข้อผิดพลาด");

  useEffect(() => {
    // กำหนดข้อความตามประเภทของข้อผิดพลาด
    switch (error) {
      case "AccessDenied":
        setErrorTitle("บัญชีถูกระงับการใช้งาน");
        setErrorMessage("บัญชีของคุณถูกระงับการใช้งานชั่วคราว โปรดติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ");
        break;
      case "CredentialsSignin":
        setErrorTitle("ข้อมูลเข้าสู่ระบบไม่ถูกต้อง");
        setErrorMessage("ข้อมูลที่ใช้ในการเข้าสู่ระบบไม่ถูกต้อง โปรดตรวจสอบและลองใหม่อีกครั้ง");
        break;
      case "OAuthAccountNotLinked":
        setErrorTitle("บัญชีไม่ได้เชื่อมต่อ");
        setErrorMessage("อีเมลนี้เคยใช้วิธีเข้าสู่ระบบอื่น โปรดใช้วิธีเข้าสู่ระบบแบบเดิม");
        break;
      case "Verification":
        setErrorTitle("รหัสยืนยันไม่ถูกต้อง");
        setErrorMessage("รหัส OTP ไม่ถูกต้องหรือหมดอายุ โปรดลองขอรหัสใหม่");
        break;
      case "Configuration":
        setErrorTitle("ข้อผิดพลาดการตั้งค่า");
        setErrorMessage("เกิดข้อผิดพลาดในการตั้งค่าระบบ โปรดติดต่อผู้ดูแลระบบ");
        break;
      case "AccountDeleted":
        setErrorTitle("บัญชีถูกลบแล้ว");
        setErrorMessage("บัญชีของคุณถูกลบออกจากระบบ ไม่สามารถเข้าใช้งานได้อีก");
        break;
      default:
        setErrorTitle("เกิดข้อผิดพลาด");
        setErrorMessage("เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ");
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-[family-name:var(--font-line-seed-sans)]">
      <Card className="max-w-md w-full">
        <CardBody className="flex flex-col items-center text-center gap-6 py-8">
          <div className="mb-2">
            <Image
              src="/Bkj_logo.svg"
              alt="บางกระเจ้า"
              width={100}
              height={50}
            />
          </div>

          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-danger/10 mb-2">
            <FaExclamationTriangle size={40} className="text-danger" />
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-2">{errorTitle}</h1>
            <p className="text-default-500 mb-6">{errorMessage}</p>
          </div>

          {error === "AccessDenied" || error === "AccountDeleted" ? (
            <div className="flex flex-col gap-3 w-full">
              <p className="text-sm text-default-500">หากคุณเชื่อว่านี่คือข้อผิดพลาด โปรดติดต่อผู้ดูแลระบบทางอีเมล:</p>
              <Link
                href="mailto:support@bangkrachao.com"
                className="text-primary-color underline"
              >
                support@bangkrachao.com
              </Link>
              
              <div className="mt-4 flex flex-col sm:flex-row w-full gap-3">
                <Button 
                  as={Link}
                  href="/"
                  color="default"
                  variant="flat"
                  fullWidth
                  startContent={<FaHome />}
                >
                  กลับสู่หน้าหลัก
                </Button>
                <Button 
                  as={Link}
                  href="/login"
                  color="primary"
                  fullWidth
                  startContent={<FaSignInAlt />}
                >
                  ลองเข้าสู่ระบบอีกครั้ง
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row w-full gap-3">
              <Button 
                as={Link}
                href="/"
                color="default"
                variant="flat"
                fullWidth
                startContent={<FaHome />}
              >
                กลับสู่หน้าหลัก
              </Button>
              <Button 
                as={Link}
                href="/login"
                color="primary"
                fullWidth
                startContent={<FaSignInAlt />}
              >
                ลองเข้าสู่ระบบอีกครั้ง
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}