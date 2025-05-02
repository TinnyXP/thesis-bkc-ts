// src/app/(tab)/community/create/forum/page.tsx
"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Input,
  Textarea,
  Button,
  Select,
  SelectItem,
  Divider
} from "@heroui/react";
import { FaArrowLeft, FaPaperPlane, FaTags } from "react-icons/fa";
import Link from "next/link";
import { Loading } from "@/components";
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

export default function CreateForumPage() {
  const { status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [category, setCategory] = useState<string>("general");
  const [tags, setTags] = useState<string>("");
  
  const { createPost, isSubmitting } = useForumPosts();

  // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
  if (status === "loading") {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

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
        router.push("/community");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      showToast("เกิดข้อผิดพลาดในการสร้างกระทู้", "error");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-default-500">
          <Link href="/community" className="hover:text-primary-color">ชุมชน</Link>
          <span>/</span>
          <Link href="/community?tab=forum" className="hover:text-primary-color">กระทู้</Link>
          <span>/</span>
          <span className="text-default-700">สร้างกระทู้ใหม่</span>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">สร้างกระทู้ใหม่</h1>
          <p className="text-default-500">แบ่งปันความคิดเห็น ถามคำถาม หรือแลกเปลี่ยนประสบการณ์</p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6">
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
            minRows={10}
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
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-between">
          <Button
            as={Link}
            href="/community"
            variant="flat"
            startContent={<FaArrowLeft />}
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
        </CardFooter>
      </Card>
    </div>
  );
}