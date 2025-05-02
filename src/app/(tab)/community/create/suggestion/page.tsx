// src/app/(tab)/community/create/complaint/page.tsx
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
  Checkbox,
  Divider
} from "@heroui/react";
import { FaArrowLeft, FaPaperPlane, FaTags, FaMapMarkerAlt, FaUpload } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { Loading } from "@/components";
import { useComplaints } from "@/hooks/useComplaints";
import { showToast } from "@/lib/toast";

// ประเภทเรื่องร้องเรียน
const complaintCategories: { label: string; value: string }[] = [
  { label: "บริการ", value: "service" },
  { label: "สถานที่", value: "place" },
  { label: "ความปลอดภัย", value: "safety" },
  { label: "สิ่งแวดล้อม", value: "environment" },
  { label: "อื่นๆ", value: "other" }
];

export default function CreateComplaintPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [category, setCategory] = useState<string>("other");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [tags, setTags] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const { submitComplaint, isSubmitting } = useComplaints();

  // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
  if (status === "loading") {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // จัดการการอัพโหลดรูปภาพ
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newImages.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }

    setImages([...images, ...newImages]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // ลบรูปภาพที่เลือก
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];

    // เพิ่ม URL.revokeObjectURL เพื่อป้องกัน memory leak
    URL.revokeObjectURL(newPreviews[index]);

    newImages.splice(index, 1);
    newPreviews.splice(index, 1);

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title.trim()) {
      showToast("กรุณากรอกหัวข้อเรื่องร้องเรียน", "error");
      return;
    }

    if (!content.trim()) {
      showToast("กรุณากรอกรายละเอียดเรื่องร้องเรียน", "error");
      return;
    }

    if (!category) {
      showToast("กรุณาเลือกหมวดหมู่", "error");
      return;
    }

    try {
      const tagsArray = tags.trim() ? tags.split(',').map(tag => tag.trim()) : [];

      const result = await submitComplaint({
        title,
        content,
        location,
        category,
        is_anonymous: isAnonymous,
        tags: tagsArray,
        images
      });

      if (result.success) {
        // ยกเลิก URL.createObjectURL เพื่อป้องกัน memory leak
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        
        showToast("ส่งเรื่องร้องเรียนเรียบร้อยแล้ว", "success");
        router.push("/community?tab=complaints");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      showToast("เกิดข้อผิดพลาดในการส่งเรื่องร้องเรียน", "error");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-default-500">
          <Link href="/community" className="hover:text-primary-color">ชุมชน</Link>
          <span>/</span>
          <Link href="/community?tab=complaints" className="hover:text-primary-color">เรื่องร้องเรียน</Link>
          <span>/</span>
          <span className="text-default-700">สร้างเรื่องร้องเรียนใหม่</span>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">สร้างเรื่องร้องเรียนใหม่</h1>
          <p className="text-default-500">แจ้งปัญหาที่พบเกี่ยวกับบางกระเจ้าเพื่อให้เจ้าหน้าที่ดำเนินการแก้ไข</p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6">
          <Input
            label="หัวข้อเรื่องร้องเรียน"
            placeholder="ระบุหัวข้อเรื่องร้องเรียนของคุณ"
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
            {complaintCategories.map((category) => (
              <SelectItem key={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </Select>
          
          <Textarea
            label="รายละเอียด"
            placeholder="อธิบายรายละเอียดเรื่องร้องเรียนของคุณ"
            value={content}
            onValueChange={setContent}
            variant="bordered"
            minRows={8}
            isRequired
          />
          
          <Input
            label="สถานที่"
            placeholder="ระบุสถานที่ที่เกี่ยวข้อง (ถ้ามี)"
            value={location}
            onValueChange={setLocation}
            variant="bordered"
            startContent={<FaMapMarkerAlt />}
          />
          
          <Input
            label="แท็ก (คั่นด้วยเครื่องหมายจุลภาค)"
            placeholder="เช่น สาธารณูปโภค, ถนน, ความสะอาด"
            value={tags}
            onValueChange={setTags}
            variant="bordered"
            startContent={<FaTags />}
            description="แท็กช่วยให้เจ้าหน้าที่เข้าใจประเภทของปัญหาได้ดีขึ้น"
          />

          <div>
            <p className="text-sm font-medium mb-2">รูปภาพประกอบ (ถ้ามี)</p>

            <div className="flex flex-wrap gap-2 mb-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <Image
                    src={preview}
                    alt={`ภาพที่ ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="solid"
                    className="absolute top-1 right-1"
                    onPress={() => handleRemoveImage(index)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>

            <Button
              color="default"
              variant="bordered"
              startContent={<FaUpload />}
              onPress={() => document.getElementById('image-upload')?.click()}
            >
              อัปโหลดรูปภาพ
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <Checkbox
            isSelected={isAnonymous}
            onValueChange={setIsAnonymous}
          >
            ไม่เปิดเผยตัวตน
          </Checkbox>

          {isAnonymous && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md text-amber-800 dark:text-amber-200 text-sm">
              <p>โปรดทราบว่าการไม่เปิดเผยตัวตนจะซ่อนชื่อของคุณจากผู้ใช้ทั่วไป แต่ผู้ดูแลระบบยังสามารถเห็นข้อมูลของคุณได้</p>
            </div>
          )}
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
            ส่งเรื่องร้องเรียน
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}