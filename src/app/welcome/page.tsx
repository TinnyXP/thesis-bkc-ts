"use client"

import React from 'react';
import { Card, CardBody, Button, Link } from "@heroui/react";
import { NavBar } from "@/components";
import { FaUserCircle } from 'react-icons/fa';

import { useSession } from "next-auth/react";
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default function WelcomePage() {
  const { data: session, status } = useSession();
  
  // ป้องกันการเข้าถึงหากไม่มี session
  if (status === "unauthenticated") {
    redirect('/login');
  }

  if (status === "loading") {
    return <div>กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans">
      <NavBar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* ส่วนหัวของหน้า */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 relative">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaUserCircle size={48} className="text-gray-400" />
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold">
              สวัสดี, คุณ {session?.user?.name} !
            </h1>
            <p className="text-default-500 mt-1">
              ยินดีต้อนรับสู่บางกระเจ้า
            </p>
            <div className="mt-1 text-xs text-gray-500">
              เข้าสู่ระบบผ่าน: {session?.user?.provider === 'line' ? 'LINE' : 'อีเมล OTP'}
            </div>
          </div>
        </div>

        {/* แถบสถานะ */}
        <Card className="mb-6 border-none bg-primary-color shadow-sm">
          <CardBody className="text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">เข้าสู่ระบบสำเร็จ!</h2>
                <p className="text-sm">ขอบคุณที่เข้าร่วมเป็นส่วนหนึ่งของชุมชนบางกระเจ้า</p>
              </div>
              <Button
                variant="flat"
                className="bg-white/30 text-white hover:bg-white/40"
                size="sm"
                as={Link}
                href="/blog"
              >
                เริ่มใช้งาน
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
              <p className="text-default-500 text-sm mb-4">บัญชีของคุณใช้อีเมล: {session?.user?.email}</p>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<FaUserCircle />}
                as={Link}
                href="/profile"
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