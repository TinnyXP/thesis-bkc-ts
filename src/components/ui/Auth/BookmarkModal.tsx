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
  Spinner,
} from "@heroui/react";
import { FaBookmark, FaTrash } from "react-icons/fa";
import { useBookmarks, Bookmark } from "@/hooks/useBookmarks";
import Link from "next/link";

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
                  <Spinner color="primary" />
                </div>
              ) : bookmarks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500">คุณยังไม่มีบุ๊คมาร์ก</p>
                  <p className="text-sm text-zinc-400 mt-2">บุ๊คมาร์กบทความที่คุณสนใจเพื่อให้สามารถกลับมาอ่านได้ภายหลัง</p>
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
                            <FaBookmark className="text-zinc-400" />
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
                        <Link 
                          href={`/blog/${bookmark.post_category}/${bookmark.post_slug}`}
                          className="text-sm text-primary-color hover:underline"
                          onClick={onClose}
                        >
                          อ่านบทความ
                        </Link>
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