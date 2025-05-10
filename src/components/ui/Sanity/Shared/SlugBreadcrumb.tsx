// src/components/ui/Sanity/Shared/SlugBreadcrumb.tsx
'use client';

import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { FaHouse } from 'react-icons/fa6';

// ปรับปรุง interface เพื่อรองรับการกำหนดเส้นทางสำหรับหมวดหมู่
interface SlugBreadcrumbProps {
  postTitle: string;
  postSlug: string;
  category?: {
    title: string;
    slug: string;
  };
  basePath?: string; // เช่น "blog" หรือ "place"
  categoryPathPrefix?: string; // เพิ่มตัวแปรนี้สำหรับ "/type/" ในกรณีของ place
}

/**
 * คอมโพเนนต์ Breadcrumb ที่ใช้ได้ทั้งกับบทความและสถานที่ท่องเที่ยว
 */
export default function SlugBreadcrumb({
  postTitle,
  postSlug,
  category,
  basePath = "blog",
  categoryPathPrefix = ""
}: SlugBreadcrumbProps) {
  // ใช้ค่าเริ่มต้นถ้าไม่มีข้อมูลหมวดหมู่
  const categorySlug = category?.slug || 'uncategorized';
  const categoryTitle = category?.title || 'ไม่มีหมวดหมู่';
  
  // สร้าง URL ตามที่กำหนด
  const categoryUrl = `/${basePath}${categoryPathPrefix ? `/${categoryPathPrefix}` : ''}/${categorySlug}`;

  return (
    <div className="w-full overflow-hidden">
      <Breadcrumbs 
        className="flex flex-nowrap items-center min-w-0"
        aria-label="เส้นทางนำทาง"
      >
        {/* ลิงก์ไปหน้าแรก */}
        <BreadcrumbItem href="/" className="flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-primary-color flex items-center justify-center transition-all duration-200 shadow hover:shadow-lg">
            <FaHouse size={16} className="text-background" aria-label="หน้าแรก" />
          </div>
        </BreadcrumbItem>

        {/* ลิงก์ไปหน้าหมวดหมู่ */}
        <BreadcrumbItem href={categoryUrl} className="flex-shrink min-w-0">
          <div className="max-w-[100px] md:max-w-[200px]">
            <p className="truncate" title={categoryTitle}>
              {categoryTitle}
            </p>
          </div>
        </BreadcrumbItem>

        {/* ลิงก์ไปหน้าบทความปัจจุบัน */}
        <BreadcrumbItem
          href={`/${basePath}${categoryPathPrefix ? `/${categoryPathPrefix}` : ''}/${categorySlug}/${postSlug}`}
          isCurrent
          className="flex-1 min-w-0"
        >
          <div className="w-full">
            <p className="truncate" title={postTitle}>
              {postTitle}
            </p>
          </div>
        </BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}