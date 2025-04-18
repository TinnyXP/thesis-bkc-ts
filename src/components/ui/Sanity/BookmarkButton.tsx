"use client";

import React, { useState } from "react";
import { Button, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { usePostBookmarkStatus } from "@/hooks/useBookmarks";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface BookmarkButtonProps {
  post: {
    _id: string;
    title: string;
    slug: { current: string };
    categories: Array<{ slug: string; title?: string }>;
    mainImage?: { 
      asset?: { 
        url?: string;
        _ref?: string; 
      } 
    };
  };
}

export default function BookmarkButton({ post }: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ตรวจสอบสถานะ bookmark ของบทความนี้
  const { isBookmarked, isLoading, toggleBookmark } = usePostBookmarkStatus(post.slug.current);

  // ผู้ใช้ต้องเข้าสู่ระบบก่อน ถึงจะสามารถบุ๊คมาร์กได้
  const handleClick = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const category = post.categories?.[0]?.slug || 'uncategorized';
      
      await toggleBookmark({
        post_id: post.slug.current,
        post_title: post.title,
        post_slug: post.slug.current,
        post_category: category,
        post_image: post.mainImage?.asset?.url
      });
      
      // ลบโค้ด addToast ที่นี่ แล้วไปใช้ showToast ใน hook แทน
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
                <p>คุณต้องเข้าสู่ระบบก่อนถึงจะสามารถบุ๊คมาร์กบทความนี้ได้</p>
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