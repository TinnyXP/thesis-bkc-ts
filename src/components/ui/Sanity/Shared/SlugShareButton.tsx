// src/components/ui/Sanity/Blog/SlugShareButton.tsx
'use client';

import React from 'react';
import { Button, Tooltip } from "@heroui/react";
import { FiCopy, FiShare2 } from 'react-icons/fi';
import { SiLine } from 'react-icons/si';
import { FaFacebook, FaXTwitter } from 'react-icons/fa6';
import { BookmarkButton } from "@/components";
import { showToast } from "@/lib/toast";

// ปรับปรุง interface ให้รองรับทั้ง Blog และ Place
interface ShareButtonsProps {
  url: string;
  title: string;
  // เปลี่ยนจาก post เป็น contentItem ที่รองรับโครงสร้างทั่วไป
  contentItem: {
    _id: string;
    title: string;
    slug: {
      current: string;
    };
    // ปรับปรุงให้รองรับทั้ง categories (สำหรับ blog) และ placeType (สำหรับ place)
    categories?: Array<{
      slug: string;
      title?: string;
    }>;
    placeType?: {
      slug: {
        current: string;
      };
      title?: string;
    };
    mainImage?: {
      asset?: {
        url?: string;
        _ref?: string;
      };
    };
  };
  contentType?: 'blog' | 'place'; // เพิ่ม contentType เพื่อรองรับทั้ง blog และ place
}

export default function SlugShareButton({ url, title, contentItem, contentType = 'blog' }: ShareButtonsProps) {
  const currentUrl = typeof window !== 'undefined'
    ? window.location.href  // ใช้ URL ปัจจุบันจาก client side
    : url;

  const isMobile = () => {
    if (typeof window === "undefined") return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = currentUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error("Fallback copy failed:", err);
          return;
        }
        document.body.removeChild(textArea);
      }

      // ใช้ showToast แทน addToast
      if (!isMobile()) {
        showToast("คัดลอกลิงก์ไปยังคลิปบอร์ดเรียบร้อย!", "success");
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = (platform: string) => {
    // ใช้ window.location.href เพื่อให้ได้ URL เต็มรูปแบบ
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title);
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        // Facebook ต้องการ URL แบบเต็มรูปแบบ
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'line':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`;
        break;
    }

    if (shareUrl) {
      // เพิ่มขนาด popup ให้ใหญ่ขึ้น
      window.open(shareUrl, '_blank', 'width=500,height=00');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <p className="text-base flex items-center gap-2">
        <FiShare2 className="w-4 h-4" />
        Share:
      </p>
      <div className="flex items-center gap-1">
        {/* เพิ่ม BookmarkButton ที่สามารถใช้ได้ทั้งกับ blog และ place */}
        <BookmarkButton contentItem={contentItem} contentType={contentType} />
        
        <Tooltip content="Copy link" className='bg-default-100 dark:bg-default-100' offset={3} placement='bottom'>
          <Button
            onPress={handleCopy}
            size='sm'
            isIconOnly
            radius='full'
            variant='flat'
            className="text-medium border-2 border-default-200 dark:border-default-100"
          >
            <FiCopy size={15} />
          </Button>
        </Tooltip>

        <Tooltip content='Facebook' className='bg-blue-500 text-white' offset={3} placement='bottom'>
          <button
            onClick={() => handleShare('facebook')}
            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-500/90 
                    flex items-center justify-center transition-all duration-200 
                    shadow hover:shadow-lgcl border-2 border-blue-400 dark:border-blue-600"
          >
            <FaFacebook size={16} className="text-white" />
          </button>
        </Tooltip>

        <Tooltip content='Twitter (X)' className='bg-zinc-800 text-white' offset={3} placement='bottom'>
          <button
            onClick={() => handleShare('twitter')}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-800/90 
                    flex items-center justify-center transition-all duration-200 
                    shadow hover:shadow-lg border-2 border-zinc-700"
          >
            <FaXTwitter size={18} className="text-white" />
          </button>
        </Tooltip>

        <Tooltip content='Line' className='bg-emerald-500 text-white' offset={3} placement='bottom'>
          <button
            onClick={() => handleShare('line')}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-500/90 
                    flex items-center justify-center transition-all duration-200 
                    shadow hover:shadow-lg border-2 border-emerald-400 dark:border-emerald-600"
          >
            <SiLine size={18} className="text-white" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}