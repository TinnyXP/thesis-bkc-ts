"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardBody, Button, Link } from "@heroui/react";
import { Loading, NavBar } from "@/components";
import { FaUserCircle } from 'react-icons/fa';

import { useSession } from "next-auth/react";
import { redirect } from 'next/navigation';

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  
  // ใช้ useEffect เพื่อตรวจสอบสถานะการเข้าสู่ระบบและป้องกันการ flash ของหน้าจอ
  useEffect(() => {
    // ป้องกันการเข้าถึงหากไม่มี session
    if (status === "unauthenticated") {
      redirect('/login');
    }
    
    // ป้องกันการเข้าถึงหากเป็นผู้ใช้ใหม่ที่ยังไม่ได้กรอกข้อมูลโปรไฟล์
    if (status === "authenticated") {
      if (session.user.isNewUser) {
        redirect('/complete-profile');
      }
      // ถ้าผ่านการตรวจสอบแล้ว จึงยกเลิกสถานะ loading
      setLoading(false);
    }
  }, [session, status]);

  // แสดง Loading state ที่สวยงาม
  if (status === "loading" || loading) {
    return (
      <Loading message='กำลังโหลดข้อมูล...' fullScreen={true} size="lg" />
    );
  }

  // ตรวจสอบซ้ำว่ามี session จริงๆ (เพิ่มความปลอดภัย)
  if (!session || !session.user) {
    redirect('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* ส่วนหัวของหน้า */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            สวัสดี, คุณ {session.user.name} !
          </h1>
          <p className="text-default-500 mt-1">
            ยินดีต้อนรับสู่บางกระเจ้า
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ID ของคุณ: {session.user.bkcId}
          </p>
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

        {/* แสดงข้อมูล Session สำหรับตรวจสอบ (เฉพาะโหมด development)
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">ข้อมูล Session (สำหรับการพัฒนา)</h3>
            <pre className="text-xs overflow-auto p-2 bg-gray-200 dark:bg-gray-700 rounded">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )} */}
      </main>
    </div>
  );
}