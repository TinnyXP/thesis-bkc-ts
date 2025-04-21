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
  Divider,
} from "@heroui/react";
import { FaStar, FaPen } from "react-icons/fa";

import RatingRadioGroup from "./RatingRadioGroup";

interface ReviewModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onSubmit: (data: { rating: number; title: string; content: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function ReviewModal({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: ReviewModalProps) {
  const [rating, setRating] = useState("5");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({
    rating: false,
    title: false,
    content: false,
  });

  // รีเซ็ตค่าเมื่อปิด Modal
  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setRating("5");
        setTitle("");
        setContent("");
        setErrors({
          rating: false,
          title: false,
          content: false,
        });
      }, 300);
    }
  }, [isOpen]);

  // ตรวจสอบความถูกต้องของข้อมูล
  const validate = () => {
    const newErrors = {
      rating: false,
      title: title.trim() === "",
      content: content.trim() === "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  // จัดการการส่งฟอร์ม
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      await onSubmit({
        rating: parseInt(rating),
        title: title.trim(),
        content: content.trim(),
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      backdrop="blur"
      classNames={{
        base: "font-[family-name:var(--font-line-seed-sans)]",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col">
              <h2 className="text-xl font-semibold">เขียนรีวิว</h2>
              <p className="text-sm text-zinc-500">แชร์ประสบการณ์ของคุณกับสถานที่นี้</p>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <div className="flex flex-col gap-6">
                  {/* ดาวให้คะแนน */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">คะแนน</label>
                    <RatingRadioGroup
                      value={rating}
                      onRatingChange={setRating}
                      size="lg"
                      color="warning"
                    />
                  </div>

                  <Divider />

                  {/* หัวข้อรีวิว */}
                  <Input
                    label="หัวข้อรีวิว"
                    placeholder="สรุปความคิดเห็นของคุณในหนึ่งประโยค"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    isInvalid={errors.title}
                    errorMessage={errors.title ? "กรุณากรอกหัวข้อรีวิว" : ""}
                    startContent={<FaPen className="text-zinc-400" />}
                    isRequired
                    variant="bordered"
                  />

                  {/* เนื้อหารีวิว */}
                  <Textarea
                    label="รายละเอียด"
                    placeholder="บอกเล่าประสบการณ์ของคุณ"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    isInvalid={errors.content}
                    errorMessage={errors.content ? "กรุณากรอกรายละเอียด" : ""}
                    minRows={4}
                    maxRows={8}
                    isRequired
                    variant="bordered"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  startContent={<FaStar />}
                  isLoading={isSubmitting}
                >
                  ส่งรีวิว
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}