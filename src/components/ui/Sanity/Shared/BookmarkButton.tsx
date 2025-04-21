"use client";

import React, { useState } from "react";
import { Button, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { usePostBookmarkStatus } from "@/hooks/useBookmarks";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { showToast } from "@/lib/toast";

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

type ContentItem = ContentWithCategories | ContentWithPlaceType;

// กำหนด prop types ให้ชัดเจน
interface BookmarkButtonProps {
  post?: ContentWithCategories;
  contentItem?: ContentItem;
  contentType?: 'blog' | 'place';
}

export default function BookmarkButton({ post, contentItem, contentType = 'blog' }: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // เราต้องกำหนดค่า item ก่อนที่จะเรียกใช้ Hook เพื่อไม่ให้ผิดกฎของ React Hooks
  const item: ContentItem | undefined = contentItem || post;
  const contentId = item?.slug.current || "";
  
  // เรียกใช้ Hook แบบไม่มีเงื่อนไข ทุกครั้งที่ render
  const { isBookmarked, isLoading, toggleBookmark } = usePostBookmarkStatus(contentId);

  // ถ้าไม่มี item ให้ return null
  if (!item) {
    console.error("BookmarkButton: ไม่พบข้อมูล post หรือ contentItem");
    return null;
  }

  // ผู้ใช้ต้องเข้าสู่ระบบก่อน ถึงจะสามารถบุ๊คมาร์กได้
  const handleClick = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    // ตรวจสอบว่ามี bkcId หรือไม่
    if (!session.user.bkcId) {
      showToast("ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่", "error");
      return;
    }

    try {
      // กำหนดค่า category หรือ placeType ตาม contentType
      let contentCategory = 'uncategorized';
      
      if (contentType === 'blog') {
        // ตรวจสอบว่ามี categories หรือไม่
        const blogItem = item as ContentWithCategories;
        if (blogItem.categories && blogItem.categories.length > 0) {
          contentCategory = blogItem.categories[0].slug || 'uncategorized';
        }
      } else { // place
        // ตรวจสอบว่ามี placeType หรือไม่
        const placeItem = item as ContentWithPlaceType;
        if (placeItem.placeType && placeItem.placeType.slug) {
          contentCategory = placeItem.placeType.slug.current || 'uncategorized';
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
          radius="full"
          color={isBookmarked ? "primary" : "default"}
          variant={isBookmarked ? "solid" : "flat"}
          className="border-1.5 border-default-200"
          isLoading={isLoading}
          onPress={handleClick}
        >
          {isBookmarked ? <FaBookmark className="text-background" /> : <FaRegBookmark />}
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