// src/components/ui/Analytics/ViewCounter.tsx
"use client";

import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";

interface ViewCounterProps {
  pageType: 'homepage' | 'blog' | 'place';
  slug: string;
  showIcon?: boolean;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
}

export default function ViewCounter({
  pageType,
  slug,
  showIcon = true,
  className = "text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1",
  textClassName = "",
  iconClassName = "text-default-400" // เปลี่ยนเป็น text-default-400 แทน text-zinc-400
}: ViewCounterProps) {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchViewCount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/views/count?page_type=${pageType}&slug=${slug}`);
        const data = await response.json();
        
        if (data.success) {
          // ใช้ unique_views หรือ total_views ตามที่ต้องการ
          setViewCount(data.unique_views);
        }
      } catch (error) {
        console.error("Error fetching view count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViewCount();
  }, [pageType, slug]);

  // แสดงตัวโหลดหรือไม่แสดงอะไรเลยถ้ากำลังโหลด
  if (isLoading) {
    return null; // หรือจะแสดง loading spinner ก็ได้
  }

  // ถ้าไม่มีข้อมูลก็ไม่แสดงอะไร
  if (viewCount === null) {
    return null;
  }

  // Format จำนวนให้สวยงาม
  const formattedCount = viewCount > 1000 
    ? `${(viewCount / 1000).toFixed(1)}k` 
    : viewCount.toString();

  return (
    <div className={className}>
      {showIcon && <FaEye className={iconClassName} />}
      <span className={textClassName}>{formattedCount} ผู้เข้าชม</span>
    </div>
  );
}