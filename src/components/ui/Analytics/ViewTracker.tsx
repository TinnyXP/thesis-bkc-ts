// src/components/ui/Analytics/ViewTracker.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface ViewTrackerProps {
  pageType: 'homepage' | 'blog' | 'place';
  slug: string;
}

export default function ViewTracker({ pageType, slug }: ViewTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        // สร้าง key สำหรับเก็บใน localStorage
        const today = new Date();
        // ปรับเวลาเป็น UTC+7 (เวลาไทย)
        today.setHours(today.getHours() + 7);
        const dateString = today.toISOString().split('T')[0];
        const trackingKey = `view_tracked_${pageType}_${slug}_${dateString}`;

        // ตรวจสอบว่าได้ทำการติดตามแล้วหรือไม่ (ในระดับ client)
        if (localStorage.getItem(trackingKey)) {
          console.log(`[ViewTracker] Already tracked: ${pageType} - ${slug} on ${dateString}`);
          return;
        }

        // ส่งข้อมูลการเข้าชมไปยัง API
        const response = await fetch('/api/views/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_type: pageType,
            slug: slug,
          }),
        });

        const result = await response.json();
        
        // ถ้าสำเร็จ ให้บันทึกลง localStorage เพื่อป้องกันการติดตามซ้ำ
        if (result.success) {
          localStorage.setItem(trackingKey, 'true');
          console.log(`[ViewTracker] Successfully tracked: ${pageType} - ${slug}`);
        }
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    // เรียกฟังก์ชันเมื่อคอมโพเนนต์ถูกโหลด
    trackPageView();
    
  }, [pageType, slug, pathname]);

  // คอมโพเนนต์นี้ไม่แสดงผลใดๆ ในหน้าเว็บ
  return null;
}