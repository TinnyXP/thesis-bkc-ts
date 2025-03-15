'use client';

import React from 'react';
import { Button, Tooltip, addToast } from "@heroui/react";
import { Copy, Share2 } from "lucide-react";
import { Facebook, Twitter } from "lucide-react";
import { ShareButtonProps } from '@/types';
import { copyToClipboard, createShareUrl, isMobileDevice } from '@/utils/helpers';

// ไอคอน Line ไม่มีใน lucide-react จึงต้องสร้างเอง
const LineIcon = () => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="18" 
      height="18" 
      stroke="currentColor" 
      fill="none"
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <path d="M9 12h6"></path>
      <path d="M12 9v6"></path>
    </svg>
  );
};

/**
 * คอมโพเนนต์ปุ่มแชร์สำหรับหน้าบทความ
 * @param url - URL ที่ต้องการแชร์
 * @param title - ชื่อเรื่องที่ต้องการแชร์
 */
export default function SlugShareButton({ url, title }: ShareButtonProps) {
  const currentUrl = typeof window !== 'undefined'
    ? window.location.href  // ใช้ URL ปัจจุบันจาก client side
    : url;

  /**
   * ฟังก์ชันคัดลอก URL ไปยังคลิปบอร์ด
   */
  const handleCopy = async () => {
    const success = await copyToClipboard(currentUrl);
    
    if (success && !isMobileDevice()) {
      addToast({
        title: "คัดลอกลิงก์ไปยังคลิปบอร์ดเรียบร้อย !",
        color: "default",
        radius: "full",
        timeout: 3000,
        hideCloseButton: true,
        shouldShowTimeoutProgress: true,
        classNames: {
          base: "font-[family-name:var(--font-line-seed-sans)]",
          title: "font-bold",
        }
      });
    }
  };

  /**
   * ฟังก์ชันแชร์ไปยังแพลตฟอร์มต่างๆ
   */
  const handleShare = (platform: string) => {
    // ใช้ window.location.href เพื่อให้ได้ URL เต็มรูปแบบ
    const shareUrl = createShareUrl(platform, currentUrl, title);
    
    if (shareUrl) {
      // เพิ่มขนาด popup ให้ใหญ่ขึ้น
      window.open(shareUrl, '_blank', 'width=500,height=500');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <p className="text-base flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        แชร์:
      </p>
      <div className="flex items-center gap-1">
        <Tooltip content="คัดลอกลิงก์" className='bg-default-100 dark:bg-default-100' offset={3} placement='bottom'>
          <Button
            onPress={handleCopy}
            size='sm'
            isIconOnly
            radius='full'
            variant='flat'
            className="text-medium border-2 border-default-200 dark:border-default-100"
            aria-label="คัดลอกลิงก์"
          >
            <Copy size={15} />
          </Button>
        </Tooltip>

        <Tooltip content='Facebook' className='bg-blue-500 text-white' offset={3} placement='bottom'>
          <button
            onClick={() => handleShare('facebook')}
            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-500/90 
                    flex items-center justify-center transition-all duration-200 
                    shadow hover:shadow-lg border-2 border-blue-400 dark:border-blue-600"
            aria-label="แชร์ไป Facebook"
          >
            <Facebook size={16} className="text-white" />
          </button>
        </Tooltip>

        <Tooltip content='Twitter (X)' className='bg-zinc-800 text-white' offset={3} placement='bottom'>
          <button
            onClick={() => handleShare('twitter')}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-800/90 
                    flex items-center justify-center transition-all duration-200 
                    shadow hover:shadow-lg border-2 border-zinc-700"
            aria-label="แชร์ไป Twitter (X)"
          >
            <Twitter size={18} className="text-white" />
          </button>
        </Tooltip>

        <Tooltip content='Line' className='bg-emerald-500 text-white' offset={3} placement='bottom'>
          <button
            onClick={() => handleShare('line')}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-500/90 
                    flex items-center justify-center transition-all duration-200 
                    shadow hover:shadow-lg border-2 border-emerald-400 dark:border-emerald-600"
            aria-label="แชร์ไป Line"
          >
            <LineIcon />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}