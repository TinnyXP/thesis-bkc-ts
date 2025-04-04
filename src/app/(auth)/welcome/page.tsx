"use client";

import React from 'react';
import { Card, CardBody, Button, Image, Link } from "@heroui/react";
import { NavBar, Footer } from "@/components";
import { FaUserCircle } from 'react-icons/fa';

import { useSession } from "next-auth/react";

export default function Page() {

  const { data: session } = useSession();
  console.log("Session data:", session);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-[family-name:var(--font-line-seed-sans)]">

      <NavBar session={session} />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* ส่วนหัวของหน้า */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            สวัสดี, คุณ {session?.user?.name} !
          </h1>
          <p className="text-default-500 mt-1">
            ยินดีต้อนรับสู่บางกระเจ้า
          </p>
        </div>

        {/* แถบสถานะ */}
        <Card className="mb-6 border-none bg-primary-color shadow-sm">
          <CardBody className="text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">ลงทะเบียนสำเร็จ!</h2>
                <p className="text-sm">ขอบคุณที่เข้าร่วมเป็นส่วนหนึ่งของชุมชนบางกระเจ้า</p>
              </div>
              <Button
                variant="flat"
                className="bg-white/30 text-white hover:bg-white/40"
                size="sm"
              >
                เริ่มต้นใช้งาน
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* คอนเทนท์หลัก */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-none bg-background/60 dark:bg-default-100/50 shadow-sm">
            <CardBody className="p-4">
              <h2 className="text-lg font-bold mb-2">บทความล่าสุด</h2>
              <p className="text-default-500 text-sm mb-4">อัพเดทข่าวสารและบทความเกี่ยวกับบางกระเจ้า</p>
              <Button
                color="primary"
                size="sm"
                as={Link}
                href="/blog"
              >
                ดูบทความทั้งหมด
              </Button>
            </CardBody>
          </Card>

          <Card className="border-none bg-background/60 dark:bg-default-100/50 shadow-sm">
            <CardBody className="p-4">
              <h2 className="text-lg font-bold mb-2">โปรไฟล์ของคุณ</h2>
              <p className="text-default-500 text-sm mb-4">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<FaUserCircle />}
              >
                ไปที่โปรไฟล์
              </Button>
            </CardBody>
          </Card>
        </div>

      </main>

    </div>
  );
}