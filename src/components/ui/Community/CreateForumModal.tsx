// src/components/ui/Community/CreateForumModal.tsx
"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Divider
} from "@heroui/react";
import { FaPaperPlane, FaTags } from "react-icons/fa";
import { useForumPosts } from "@/hooks/useForumPosts";
import { showToast } from "@/lib/toast";

// ประเภทกระทู้
const forumCategories: { label: string; value: string }[] = [
  { label: "คำถามทั่วไป", value: "general" },
  { label: "แนะนำสถานที่", value: "place" },
  { label: "รีวิวและประสบการณ์", value: "review" },
  { label: "แลกเปลี่ยนความรู้", value: "knowledge" },
  { label: "ประกาศ", value: "announcement" }
];

interface CreateForumModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onCreated?: () => void;
}

export default function CreateForumModal({
  isOpen,
  onOpenChange,
  onCreated
}: CreateForumModalProps) {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [category, setCategory] = useState<string>("general");
  const [tags, setTags] = useState<string>("");
  
  const { createPost, isSubmitting } = useForumPosts();

  // รีเซ็ตฟอร์มเมื่อปิด Modal
  const handleClose = () => {
    setTitle("");
    setContent("");
    setCategory("general");
    setTags("");
    onOpenChange();
  };

  const handleSubmit = async () => {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title.trim()) {
      showToast("กรุณากรอกหัวข้อกระทู้", "error");
      return;
    }

    if (!content.trim()) {
      showToast("กรุณากรอกเนื้อหากระทู้", "error");
      return;
    }

    if (!category) {
      showToast("กรุณาเลือกหมวดหมู่", "error");
      return;
    }

    // แปลง tags เป็น array
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    try {
      const result = await createPost({
        title,
        content,
        category,
        tags: tagsArray
      });

      if (result.success) {
        showToast("สร้างกระทู้เรียบร้อยแล้ว", "success");
        handleClose();
        if (onCreated) onCreated();
      }
    } catch (error) {
      console.error("Error creating post:", error);
      showToast("เกิดข้อผิดพลาดในการสร้างกระทู้", "error");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h1 className="text-xl font-bold">สร้างกระทู้ใหม่</h1>
              <p className="text-default-500 text-sm">แบ่งปันความคิดเห็น ถามคำถาม หรือแลกเปลี่ยนประสบการณ์</p>
            </ModalHeader>
            <Divider />
            <ModalBody className="space-y-6">
              <Input
                label="หัวข้อกระทู้"
                placeholder="ระบุหัวข้อกระทู้ของคุณ"
                value={title}
                onValueChange={setTitle}
                variant="bordered"
                isRequired
              />
              
              <Select
                label="หมวดหมู่"
                placeholder="เลือกหมวดหมู่"
                selectedKeys={[category]}
                onChange={(e) => setCategory(e.target.value)}
                variant="bordered"
                isRequired
              >
                {forumCategories.map((category) => (
                  <SelectItem key={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Textarea
                label="เนื้อหา"
                placeholder="กรอกเนื้อหากระทู้"
                value={content}
                onValueChange={setContent}
                variant="bordered"
                minRows={8}
                isRequired
              />
              
              <Input
                label="แท็ก (คั่นด้วยเครื่องหมายจุลภาค)"
                placeholder="เช่น ท่องเที่ยว, อาหาร, ธรรมชาติ"
                value={tags}
                onValueChange={setTags}
                variant="bordered"
                startContent={<FaTags />}
                description="แท็กช่วยให้ผู้อื่นค้นพบกระทู้ของคุณได้ง่ายขึ้น"
              />
            </ModalBody>
            <Divider />
            <ModalFooter className="flex justify-between">
              <Button
                variant="flat"
                onPress={onClose}
              >
                ยกเลิก
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                startContent={!isSubmitting && <FaPaperPlane />}
              >
                สร้างกระทู้
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}