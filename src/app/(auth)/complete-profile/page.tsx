"use client"

import React, { useEffect, useState, useRef } from "react";
import {
  Button, Input, Tooltip, Spinner,
  Link
} from "@heroui/react";
import { PiPencilSimpleLineFill } from "react-icons/pi";
import { MdCancel } from "react-icons/md";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaCamera, FaUser } from "react-icons/fa";
import { Loading } from "@/components";

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
        // อัพเดทเซสชัน (session) แบบเดิม
        await update({
          ...session,
          user: {
            ...session?.user,
            isNewUser: false,
            name: data.user.name,
            image: data.user.image
          }
        });

        // แทนที่จะใช้ router.replace ซึ่งใช้ client-side navigation
        // ให้ใช้ window.location.href เพื่อทำการ full page reload
        // เพื่อให้ได้ session ล่าสุดจากเซิร์ฟเวอร์
        window.location.href = '/welcome';
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
    return (
      <Loading message='กำลังโหลดข้อมูล...' fullScreen={true} size="lg" />
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {/* รูปโปรไฟล์ */}
            <div className="flex flex-col items-center mb-2 gap-2">
              <div
                className="relative w-40 h-40 rounded-full mb-2 cursor-pointer overflow-hidden bg-gray-200/20 dark:bg-gray-200/5 flex items-center justify-center border-2 border-solid border-default-300"
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
                onChange={handleImageChange}
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
                    // onPress={clearImage}
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

            {/* ปุ่มบันทึก */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                color="primary"
                className="w-full font-semibold"
                isLoading={isLoading}
                isDisabled={isLoading}
                startContent={isLoading ? <Spinner size="sm" /> : <PiPencilSimpleLineFill size={20} />}
              >
                {isLoading ? "กำลังสร้างโปรไฟล์..." : "สร้างโปรไฟล์"}
              </Button>
              <Button
                isIconOnly
                type="button"
                className="flex-1"
                onClick={handleCancel}
                color="danger"
                disabled={isLoading}
              >
                <MdCancel size={24} />
              </Button>
            </div>
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