'use client';

import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { FaHouse } from 'react-icons/fa6';
import { PlaceType } from '@/lib/sanity/schema';

interface PlaceBreadcrumbProps {
  placeTitle: string;
  placeSlug: string;
  placeType?: PlaceType;
}

/**
 * คอมโพเนนต์ Breadcrumb สำหรับหน้ารายละเอียดสถานที่ท่องเที่ยว
 */
export default function PlaceBreadcrumb({
  placeTitle,
  placeSlug,
  placeType
}: PlaceBreadcrumbProps) {
  // ใช้ค่าเริ่มต้นถ้าไม่มีข้อมูลประเภทสถานที่
  const placeTypeSlug = placeType?.slug?.current || 'uncategorized';
  const placeTypeTitle = placeType?.title || 'ไม่ระบุประเภท';

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

        {/* ลิงก์ไปหน้ารวมสถานที่ท่องเที่ยว */}
        <BreadcrumbItem href="/place" className="flex-shrink min-w-0">
          <div className="max-w-[100px] md:max-w-[200px]">
            <p className="truncate" title="สถานที่ท่องเที่ยว">
              สถานที่ท่องเที่ยว
            </p>
          </div>
        </BreadcrumbItem>
        
        {/* ลิงก์ไปหน้าประเภทสถานที่ */}
        <BreadcrumbItem href={`/place/type/${placeTypeSlug}`} className="flex-shrink min-w-0">
          <div className="max-w-[100px] md:max-w-[200px]">
            <p className="truncate" title={placeTypeTitle}>
              {placeTypeTitle}
            </p>
          </div>
        </BreadcrumbItem>

        {/* ลิงก์ไปหน้าสถานที่ท่องเที่ยวปัจจุบัน */}
        <BreadcrumbItem
          href={`/place/${placeTypeSlug}/${placeSlug}`}
          isCurrent
          className="flex-1 min-w-0"
        >
          <div className="w-full">
            <p className="truncate" title={placeTitle}>
              {placeTitle}
            </p>
          </div>
        </BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}