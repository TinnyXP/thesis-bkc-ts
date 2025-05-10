// src/app/(tab)/community/[type]/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button, Spinner } from "@heroui/react";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { Loading, ForumDetail, ComplaintDetail } from "@/components";

export default function CommunityDetailPage() {
  const { type, id } = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [isInitializing, setIsInitializing] = useState(true);

  // ตรวจสอบว่า type ที่ส่งมาถูกต้อง
  useEffect(() => {
    if (isInitializing && type) {
      // ตรวจสอบว่า type เป็น 'forum' หรือ 'complaint' เท่านั้น
      if (type !== 'forum' && type !== 'complaint') {
        router.push('/community?tab=forum');
      }
      setIsInitializing(false);
    }
  }, [type, router, isInitializing]);

  // หากยังไม่มีการโหลดข้อมูล session
  if (status === "loading" || isInitializing) {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-default-500 mb-4">
            <Link href="/" className="hover:text-primary-color">หน้าหลัก</Link>
            <span>/</span>
            <Link href="/community" className="hover:text-primary-color">ชุมชน</Link>
            <span>/</span>
            <Link 
              href={`/community?tab=${type}`} 
              className="hover:text-primary-color"
            >
              {type === 'forum' ? 'กระทู้' : 'เรื่องร้องเรียน'}
            </Link>
            <span>/</span>
            <span className="text-default-700 truncate max-w-[200px]">รายละเอียด</span>
          </div>
          
          <Button
            as={Link}
            href={`/community?tab=${type}`}
            variant="light"
            startContent={<FaArrowLeft />}
            className="mb-4"
          >
            กลับไปยังหน้า{type === 'forum' ? 'กระทู้' : 'เรื่องร้องเรียน'}
          </Button>
        </div>

        {/* แสดงรายละเอียดตามประเภท */}
        {type === 'forum' ? (
          <ForumDetail postId={id as string} />
        ) : type === 'complaint' ? (
          <ComplaintDetail complaintId={id as string} />
        ) : (
          <div className="text-center py-12">
            <Spinner size="lg" color="primary" className="mb-4" />
            <p className="text-default-500">กำลังโหลดข้อมูล...</p>
          </div>
        )}
      </div>
    </div>
  );
}