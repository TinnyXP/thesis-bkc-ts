// src/components/ui/Auth/BookmarkModal.tsx
"use client";

import React, { useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Listbox,
  ListboxItem,
  Image,
} from "@heroui/react";
import { FaBookmark, FaTrash, FaNewspaper, FaMapMarkerAlt } from "react-icons/fa";
import { useBookmarks, Bookmark } from "@/hooks/useBookmarks";
import Link from "next/link";
import Loading from "@/components/layout/Loading";

export interface BookmarkModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export default function BookmarkModal({ isOpen, onOpenChange }: BookmarkModalProps) {
  const { bookmarks, isLoading, removeBookmark, refreshBookmarks } = useBookmarks();
  const [isRemoving, setIsRemoving] = React.useState<string | null>(null);

  // เพิ่ม useEffect เพื่อให้ refresh ข้อมูลทุกครั้งที่เปิด Modal
  useEffect(() => {
    if (isOpen) {
      refreshBookmarks();
    }
  }, [isOpen, refreshBookmarks]);

  const handleRemoveBookmark = async (postId: string) => {
    setIsRemoving(postId);
    await removeBookmark(postId);
    setIsRemoving(null);
  };

  // สร้างลิงก์ไปยังเนื้อหาตาม content_type
  const getContentLink = (bookmark: Bookmark) => {
    if (bookmark.content_type === 'place') {
      return `/place/${bookmark.post_category}/${bookmark.post_slug}`;
    }
    return `/blog/${bookmark.post_category}/${bookmark.post_slug}`;
  };

  // สร้างข้อความลิงก์ตาม content_type
  const getContentLinkText = (bookmark: Bookmark) => {
    return bookmark.content_type === 'place' ? 'ดูสถานที่' : 'อ่านบทความ';
  };

  // สร้างไอคอนตาม content_type
  const getContentIcon = (bookmark: Bookmark) => {
    return bookmark.content_type === 'place' ? <FaMapMarkerAlt className="text-primary-color" /> : <FaNewspaper className="text-zinc-400" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="md"
      backdrop='blur'
      scrollBehavior="inside"
      classNames={{
        body: "py-2",
        base: "font-[family-name:var(--font-line-seed-sans)]",
        closeButton: "hover:bg-white/5 active:bg-white/10 right-4 top-3.5",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FaBookmark className="text-primary-color" />
                <span>บุ๊คมาร์กของฉัน</span>
              </div>
            </ModalHeader>
            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loading />
                </div>
              ) : bookmarks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500">คุณยังไม่มีบุ๊คมาร์ก</p>
                  <p className="text-sm text-zinc-400 mt-2">บุ๊คมาร์กบทความหรือสถานที่ที่คุณสนใจเพื่อให้สามารถกลับมาดูได้ภายหลัง</p>
                </div>
              ) : (
                <Listbox
                  aria-label="Bookmark list"
                  variant="flat"
                  className="p-0 gap-0 divide-y divide-default-200"
                >
                  {bookmarks.map((bookmark: Bookmark) => (
                    <ListboxItem
                      key={bookmark._id}
                      startContent={
                        bookmark.post_image ? (
                          <Image
                            src={bookmark.post_image}
                            alt={bookmark.post_title}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-zinc-200 rounded-md flex items-center justify-center">
                            {getContentIcon(bookmark)}
                          </div>
                        )
                      }
                      endContent={
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          size="sm"
                          isLoading={isRemoving === bookmark.post_id}
                          onPress={() => handleRemoveBookmark(bookmark.post_id)}
                        >
                          <FaTrash size={14} />
                        </Button>
                      }
                      description={
                        <div className="flex items-center gap-1">
                          {bookmark.content_type === 'place' ? <FaMapMarkerAlt size={12} /> : <FaNewspaper size={12} />}
                          <Link
                            href={getContentLink(bookmark)}
                            className="text-sm text-primary-color hover:underline"
                            onClick={onClose}
                          >
                            {getContentLinkText(bookmark)}
                          </Link>
                        </div>
                      }
                    >
                      {bookmark.post_title}
                    </ListboxItem>
                  ))}
                </Listbox>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}