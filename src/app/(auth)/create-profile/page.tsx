"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaCamera, FaUser } from "react-icons/fa";
import {
  Button, Input, Tooltip, Textarea, Spinner,
  Link
} from "@heroui/react";
import { PiPencilSimpleLineFill } from "react-icons/pi";
import { useMockAuth } from '@/lib/auth/mockAuthContext';
import { useMockProfileImage } from '@/lib/hooks/useMockProfileImage';

export default function CreateProfilePage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, updateProfile } = useMockAuth();
  const router = useRouter();
  
  // Profile image hook
  const {
    imageFile,
    previewUrl,
    fileInputRef,
    openFileDialog,
    handleFileChange,
    clearImage,
    resetToInitial,
    isLoading: isImageLoading
  } = useMockProfileImage(null);

  // Local state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // เช็คว่าปุ่มบันทึกพร้อมกดหรือไม่
  const isSaveDisabled = !name.trim() || isLoading || isRedirecting;

  // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    // ถ้ามีโปรไฟล์แล้ว ให้ redirect ไปหน้า profile
    if (isAuthenticated && user && user.name) {
      router.replace('/profile');
    }
  }, [isAuthenticated, user, router]);

  // จัดการการบันทึกโปรไฟล์
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("กรุณากรอกชื่อของคุณ");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateProfile({
        name,
        bio,
        profileImage: imageFile
      });

      if (result.success) {
        setSuccess("สร้างโปรไฟล์สำเร็จ");
        setIsRedirecting(true);

        // เพิ่ม firstLogin สำหรับ popup ต้อนรับ
        localStorage.setItem('firstLogin', 'true');

        // ตั้งเวลาเพื่อ redirect
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      } else {
        setError(result.error || "ไม่สามารถสร้างโปรไฟล์ได้");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างโปรไฟล์");
    } finally {
      setIsLoading(false);
    }
  };

  // แสดงหน้า loading เมื่อกำลังตรวจสอบ session
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Spinner
          classNames={{
            label: "text-foreground mt-4 font-[family-name:var(--font-line-seed-sans)]"
          }}
          variant="gradient"
          size="lg"
        />
      </div>
    );
  }

  return (
    <section className="font-[family-name:var(--font-line-seed-sans)] min-h-screen flex flex-col items-center justify-center p-4">

      <div className="flex flex-col items-center pb-6">
        <Image
          src="/Bkj_logo.svg"
          alt="Bangkrachoa Logo"
          width={120}
          height={60}
          className="mb-4"
        />
        <p className="text-xl font-bold">สร้างโปรไฟล์ของคุณ</p>
        <p className="text-small text-default-500">กรุณากรอกข้อมูลเพิ่มเติมเพื่อเริ่มใช้งาน</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 rounded-large bg-content1 px-8 pb-6 pt-6 shadow-small">
        <div>
          {/* แสดงข้อความแจ้งเตือน */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
              {isRedirecting && (
                <p className="text-sm mt-2">กำลังนำคุณไปยังหน้าหลัก...</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* รูปโปรไฟล์ */}
            <div className="flex flex-col items-center mb-2 gap-2">
              <div
                className="relative w-40 h-40 rounded-full mb-2 cursor-pointer overflow-hidden bg-gray-300/5 flex items-center justify-center border-2 border-solid border-default-300"
                onClick={openFileDialog}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile preview"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <FaUser size={60} className="text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <FaCamera size={44} className="text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  คลิกเพื่ออัปโหลดรูปโปรไฟล์
                </p>
                {previewUrl && (
                  <Tooltip content="ลบรูปโปรไฟล์">
                    <Link
                      size="sm"
                      color="danger"
                      className="cursor-pointer"
                      onPress={clearImage}
                    >
                      ลบ
                    </Link>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* ชื่อ */}
            <Input
              type="text"
              label="ชื่อของคุณ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="กรอกชื่อที่ต้องการแสดง"
              isRequired
              variant="bordered"
              errorMessage={!name.trim() && "กรุณากรอกชื่อของคุณ"}
              description="ชื่อนี้จะแสดงในหน้าโปรไฟล์และการโพสต์ของคุณ"
              startContent={<FaUser className="text-default-400" />}
            />

            {/* ข้อมูลเพิ่มเติม */}
            <Textarea
              label="เกี่ยวกับฉัน"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="เล่าเกี่ยวกับตัวคุณสักเล็กน้อย (ไม่บังคับ)"
              variant="bordered"
              minRows={3}
            />

            {/* ปุ่มบันทึก */}
            <Button
              type="submit"
              color="primary"
              className="w-full font-semibold"
              isLoading={isLoading || isRedirecting}
              isDisabled={isSaveDisabled}
              startContent={isLoading || isRedirecting ? <Spinner size="sm" /> : <PiPencilSimpleLineFill size={20} />}
            >
              {isLoading ? "กำลังสร้างโปรไฟล์..." :
                isRedirecting ? "กำลังนำไปยังหน้าหลัก..." : "สร้างโปรไฟล์"}
            </Button>
          </form>

          <div className="mt-4 text-center text-tiny text-default-500">
            การสร้างโปรไฟล์ถือว่าคุณยอมรับ
            <Link href="/privacy-policy" className="text-primary-color mx-1 hover:underline cursor-pointer text-tiny">
              นโยบายความเป็นส่วนตัว
            </Link>
            และ
            <Link href="/terms" className="text-primary-color mx-1 hover:underline cursor-pointer text-tiny">
              เงื่อนไขการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}