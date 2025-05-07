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
        // ส่งข้อมูลการเข้าชมไปยัง API
        await fetch('/api/views/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_type: pageType,
            slug: slug,
          }),
        });
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    // เรียกฟังก์ชันเมื่อคอมโพเนนต์ถูกโหลด
    trackPageView();
    
    // ใช้สำหรับการทำงานใน development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ViewTracker] Tracking page view: ${pageType} - ${slug}`);
    }
  }, [pageType, slug, pathname]);

  // คอมโพเนนต์นี้ไม่แสดงผลใดๆ ในหน้าเว็บ
  return null;
}