"use client"

import React, { useEffect, useState, useRef } from "react";
import { Form, Input, Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaCamera, FaUser } from "react-icons/fa";

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าเป็นผู้ใช้ใหม่หรือไม่
    if (status === "authenticated") {
      if (!session.user.isNewUser) {
        router.replace('/welcome');
      }
    } else if (status === "unauthenticated") {
      router.replace('/login');
    }
  }, [session, status, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("กรุณากรอกชื่อของคุณ");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // อัพเดทเซสชัน
        await update({
          ...session,
          user: {
            ...session?.user,
            isNewUser: false,
            name: data.user.name,
            image: data.user.image
          }
        });
        
        // ไปยังหน้า welcome
        router.replace('/welcome');
      } else {
        setError(data.message || "ไม่สามารถสร้างโปรไฟล์ได้");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      setError("เกิดข้อผิดพลาดในการสร้างโปรไฟล์");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">กำลังโหลด...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-4 p-6">
          <Image
            src="/Bkj_logo.svg"
            alt="Bangkrachao Logo"
            width={120}
            height={60}
            className="mb-2"
          />
          <h1 className="text-2xl font-bold text-center">สร้างโปรไฟล์ของคุณ</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            กรุณากรอกข้อมูลเพิ่มเติมเพื่อเริ่มใช้งาน
          </p>
        </CardHeader>
        
        <Divider />
        
        <CardBody className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <Form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center">
              <div
                className="relative w-24 h-24 rounded-full mb-4 cursor-pointer overflow-hidden bg-gray-200 flex items-center justify-center"
                onClick={handleImageClick}
              >
                {previewUrl ? (
                  <Image 
                    src={previewUrl} 
                    alt="Profile preview" 
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <FaUser size={40} className="text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <FaCamera size={24} className="text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                คลิกเพื่ออัปโหลดรูปโปรไฟล์ (ไม่บังคับ)
              </p>
            </div>
            
            {/* Name Input */}
            <Input
              type="text"
              label="ชื่อของคุณ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="กรอกชื่อของคุณ"
              isRequired
              fullWidth
            />
            
            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                type="submit" 
                color="primary" 
                isLoading={isLoading}
                className="flex-1"
              >
                สร้างโปรไฟล์
              </Button>
              <Button
                type="button"
                variant="flat"
                className="flex-1"
                onClick={handleCancel}
                disabled={isLoading}
              >
                ยกเลิก
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}