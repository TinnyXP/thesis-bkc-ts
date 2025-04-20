// src/components/ui/Sanity/Blog/BookmarkButton.tsx
"use client";

import React, { useState } from "react";
import { Button, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { usePostBookmarkStatus } from "@/hooks/useBookmarks";
import { useSession } from "next-auth/react";
import Link from "next/link";

// กำหนด interface สำหรับทั้ง post และ contentItem
interface ContentWithCategories {
  _id: string;
  title: string;
  slug: { 
    current: string;
  };
  categories?: Array<{
    slug: string;
    title?: string;
  }>;
  mainImage?: { 
    asset?: { 
      url?: string;
      _ref?: string; 
    } 
  };
}

interface ContentWithPlaceType {
  _id: string;
  title: string;
  slug: { 
    current: string;
  };
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
    } 
  };
}

// กำหนด prop types ให้ชัดเจน
interface BookmarkButtonProps {
  post?: ContentWithCategories;
  contentItem?: ContentWithCategories | ContentWithPlaceType;
  contentType?: 'blog' | 'place';
}

export default function BookmarkButton({ post, contentItem, contentType = 'blog' }: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ใช้ post หรือ contentItem ตามที่ได้รับ
  const item = contentItem || post;
  if (!item) {
    console.error("BookmarkButton: ไม่พบข้อมูล post หรือ contentItem");
    return null;
  }
  
  // ใช้ slug ของ item เป็น id สำหรับ bookmark
  const contentId = item.slug.current;
  
  // ตรวจสอบสถานะ bookmark ของบทความหรือสถานที่นี้
  const { isBookmarked, isLoading, toggleBookmark } = usePostBookmarkStatus(contentId);

  // ผู้ใช้ต้องเข้าสู่ระบบก่อน ถึงจะสามารถบุ๊คมาร์กได้
  const handleClick = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      // กำหนดค่า category หรือ placeType ตาม contentType
      let contentCategory: string = 'uncategorized';
      
      if (contentType === 'blog') {
        // ตรวจสอบว่ามี categories หรือไม่
        if ('categories' in item && item.categories && item.categories.length > 0) {
          contentCategory = item.categories[0].slug || 'uncategorized';
        }
      } else { // place
        // ตรวจสอบว่ามี placeType หรือไม่
        if ('placeType' in item && item.placeType && item.placeType.slug) {
          contentCategory = item.placeType.slug.current || 'uncategorized';
        }
      }
      
      await toggleBookmark({
        post_id: contentId,
        post_title: item.title,
        post_slug: item.slug.current,
        post_category: contentCategory,
        post_image: item.mainImage?.asset?.url,
        content_type: contentType
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  // กรณีแสดงปุ่ม login/signup modal (ถ้าผู้ใช้ยังไม่เข้าสู่ระบบ)
  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <>
      <Tooltip content={isBookmarked ? "ลบบุ๊คมาร์ก" : "เพิ่มบุ๊คมาร์ก"}>
        <Button
          isIconOnly
          size="sm"
          color={isBookmarked ? "warning" : "default"}
          variant={isBookmarked ? "solid" : "flat"}
          className="border-1.5 border-default-200"
          isLoading={isLoading}
          onPress={handleClick}
        >
          {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
        </Button>
      </Tooltip>
      
      {/* Modal สำหรับแจ้งให้ผู้ใช้เข้าสู่ระบบ */}
      <Modal isOpen={isAuthModalOpen} onOpenChange={handleAuthModalClose} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">เข้าสู่ระบบเพื่อใช้งาน</ModalHeader>
              <ModalBody>
                <p>คุณต้องเข้าสู่ระบบก่อนถึงจะสามารถบุ๊คมาร์ก{contentType === 'blog' ? 'บทความ' : 'สถานที่'}นี้ได้</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button 
                  color="primary" 
                  as={Link}
                  href="/login"
                >
                  เข้าสู่ระบบ
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}