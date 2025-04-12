"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaCamera, FaUser } from "react-icons/fa";
import {
  Button, Input, Tooltip, Textarea, Spinner,
  Link
} from "@heroui/react";
import { PiPencilSimpleLineFill } from "react-icons/pi";

export default function CreateProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // สถานะสำหรับข้อมูลโปรไฟล์
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // สถานะสำหรับการแสดงผล
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // เช็คว่าปุ่มบันทึกพร้อมกดหรือไม่
  const isSaveDisabled = !name.trim() || isLoading || isRedirecting;

  // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    console.log("CreateProfile: Session status:", status, "User:", session?.user);

    // ถ้าไม่ได้ล็อกอิน ให้เปลี่ยนเส้นทางไปหน้า login
    if (status === "unauthenticated") {
      console.log("CreateProfile: Not authenticated, redirecting to login");
      router.replace('/login');
      return;
    }

    // เพิ่มเงื่อนไขตรวจสอบว่าเป็นผู้ใช้ที่มี session พร้อมใช้งาน
    if (status === "authenticated") {
      // ถ้าไม่ใช่ผู้ใช้ใหม่และไม่ได้มี flag isNewUser ให้ไปหน้า profile
      if (session?.user?.id !== 'new-user' && !session.user.isNewUser) {
        console.log("CreateProfile: User already has a profile, redirecting to profile page");
        router.replace('/profile');
        return;
      }

      // ตั้งค่าข้อมูลเริ่มต้นสำหรับผู้ใช้ที่เข้าสู่ระบบแล้ว
      if (session.user.name) {
        setName(session.user.name);
      }

      if (session.user.image) {
        setPreviewUrl(session.user.image);
      }
    }
  }, [session, status, router]);

  // จัดการการเปลี่ยนรูปโปรไฟล์
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // หากมี URL ก่อนหน้า ให้ revoke เพื่อคืนหน่วยความจำ
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // จัดการการคลิกที่รูปโปรไฟล์
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // ล้างรูปโปรไฟล์ - แก้ไขเพื่อให้สามารถอัปโหลดรูปเดิมซ้ำได้
  const handleClearImage = () => {
    // ถ้ามี URL ที่สร้างไว้ ให้ revoke เพื่อคืนหน่วยความจำ
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // รีเซ็ต state
    setProfileImage(null);
    setPreviewUrl(null);

    // รีเซ็ตค่าใน input element เพื่อให้สามารถเลือกไฟล์เดิมได้อีกครั้ง
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      console.log("CreateProfile: Submitting profile data to API", {
        name,
        bio,
        hasProfileImage: !!profileImage
      });

      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("CreateProfile: API error response", {
          status: response.status,
          message: errorData.message || "Unknown error"
        });
        throw new Error(errorData.message || `Error ${response.status}: Could not create profile`);
      }

      const data = await response.json();
      console.log("CreateProfile: API response:", data);

      if (data.success) {
        // ทำความสะอาด localStorage
        const cleanLocalStorage = () => {
          localStorage.removeItem('loginEmail');
          localStorage.removeItem('otpSent');
          localStorage.removeItem('otpCountdown');
          localStorage.removeItem('otpTimestamp');
          // เพิ่ม firstLogin สำหรับ popup ต้อนรับ
          localStorage.setItem('firstLogin', 'true');
        };

        cleanLocalStorage();

        setSuccess(data.message || "สร้างโปรไฟล์สำเร็จ");
        setIsRedirecting(true);

        // อัพเดทเซสชันด้วยข้อมูลใหม่
        try {
          await update({
            ...session,
            user: {
              ...session?.user,
              id: data.user.id,
              isNewUser: false,
              name: data.user.name,
              image: data.user.image
            }
          });

          console.log("CreateProfile: Session updated successfully");
          sessionStorage.setItem('session_updated', 'true');

          // ตั้งเวลาเพื่อ redirect
          setTimeout(() => {
            console.log("CreateProfile: Redirecting to home page");
            window.location.href = '/';
          }, 1500);
        } catch (updateError) {
          console.error("CreateProfile: Error updating session", updateError);
          sessionStorage.setItem('session_updated', 'true');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
      } else {
        console.error("CreateProfile: Error creating profile", data.message);
        setError(data.message || "ไม่สามารถสร้างโปรไฟล์ได้");
      }
    } catch (error) {
      console.error("CreateProfile: Error creating profile:", error);
      setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างโปรไฟล์");
    } finally {
      setIsLoading(false);
    }
  };

  // แสดงหน้า loading เมื่อกำลังตรวจสอบ session
  if (status === "loading") {
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

  // แสดงหน้าสร้างโปรไฟล์
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
                      onPress={handleClearImage}
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