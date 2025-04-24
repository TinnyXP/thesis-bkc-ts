// src/components/ui/Admin/EditUserModal.tsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Tooltip,
} from "@heroui/react";
import { FaUserEdit, FaCamera, FaCheck, FaTimes } from "react-icons/fa";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { User } from "@/hooks/useUsersManagement";

interface EditUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  onUserUpdated: () => void;
}

export default function EditUserModal({
  isOpen,
  onOpenChange,
  user,
  onUserUpdated,
}: EditUserModalProps) {
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUserName(user.name || "");
      setPreviewUrl(user.image);
      setRemoveProfileImage(false);
    }
  }, [user, isOpen]);

  // จัดการกับการเลือกรูปโปรไฟล์
  const handleImageClick = () => {
    if (removeProfileImage) setRemoveProfileImage(false);
    fileInputRef.current?.click();
  };

  // จัดการกับการเปลี่ยนรูปโปรไฟล์
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setRemoveProfileImage(false);
    }
  };

  // ล้างรูปโปรไฟล์
  const clearImage = () => {
    setRemoveProfileImage(true);
    setProfileImage(null);
    if (previewUrl && !user?.image) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // บันทึกการแก้ไข
  const handleUpdateUser = async () => {
    if (!user) return;

    if (!userName.trim()) {
      showToast("กรุณากรอกชื่อผู้ใช้", "error");
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("name", userName);
      
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }
      
      formData.append("removeProfileImage", removeProfileImage.toString());

      const response = await fetch(`/api/admin/users/${user.id}/update-profile`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        showToast("อัปเดตข้อมูลผู้ใช้สำเร็จ", "success");
        onUserUpdated();
        onOpenChange(false);
      } else {
        showToast(data.message || "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้", "error");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      showToast("เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FaUserEdit className="text-primary" />
                <span>แก้ไขข้อมูลผู้ใช้</span>
              </div>
            </ModalHeader>
            <ModalBody>
              {/* รูปโปรไฟล์ */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <div
                  className="relative w-32 h-32 rounded-full cursor-pointer overflow-hidden bg-zinc-200/20 dark:bg-zinc-200/5 flex items-center justify-center border-2 border-solid border-default-300"
                  onClick={handleImageClick}
                >
                  {removeProfileImage ? (
                    <FaUserEdit size={40} className="text-zinc-400" />
                  ) : previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Profile preview"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <FaUserEdit size={40} className="text-zinc-400" />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <FaCamera size={32} className="text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {/* ปุ่มลบรูปโปรไฟล์ */}
                {(previewUrl || user?.image) && !removeProfileImage && (
                  <Tooltip content="ลบรูปโปรไฟล์">
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="flat"
                      onPress={clearImage}
                    >
                      <FaTimes />
                    </Button>
                  </Tooltip>
                )}

                <p className="text-xs text-zinc-500">คลิกที่รูปภาพเพื่ออัปโหลดรูปโปรไฟล์ใหม่</p>
              </div>

              {/* ชื่อผู้ใช้ */}
              <Input
                label="ชื่อผู้ใช้"
                placeholder="กรอกชื่อผู้ใช้"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                variant="bordered"
              />

              {user && (
                <div className="text-xs mt-2">
                  <p><span className="font-semibold">อีเมล:</span> {user.email}</p>
                  <p><span className="font-semibold">BKC ID:</span> {user.bkcId}</p>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button
                color="primary"
                onPress={handleUpdateUser}
                isLoading={isUpdating}
                startContent={!isUpdating && <FaCheck />}
              >
                บันทึกการแก้ไข
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}