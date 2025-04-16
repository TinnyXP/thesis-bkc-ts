"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  Divider,
  useDisclosure,
  Tabs,
  Tab,
  AvatarIcon,
  Input,
  Tooltip,
} from "@heroui/react";
import { FaBell, FaMoon, FaTrash, FaExclamationTriangle, FaUserEdit, FaCamera, FaCheck, FaTimes } from "react-icons/fa";
import { FiSettings, FiUser } from "react-icons/fi";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export default function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // สถานะสำหรับการแก้ไขโปรไฟล์
  const [userName, setUserName] = useState(session?.user?.name || "");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState("");
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);

  // ใช้ useDisclosure สำหรับการควบคุม modal ยืนยันการลบบัญชี
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onOpenChange: onDeleteConfirmChange,
    onClose: onDeleteConfirmClose
  } = useDisclosure();

  // อัปเดต state เมื่อ session เปลี่ยน
  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name);
    }
    // รีเซ็ตสถานะการอัปเดตโปรไฟล์เมื่อ modal ถูกเปิด
    if (isOpen) {
      setProfileUpdateSuccess(false);
      setProfileUpdateError("");
      setProfileImage(null);
      setPreviewUrl(null);
      setRemoveProfileImage(false);
    }
  }, [session, isOpen]);

  // อัปเดต isDarkMode เมื่อ theme เปลี่ยน
  useEffect(() => {
    setIsDarkMode(theme === "dark");
  }, [theme]);

  // จัดการการเปลี่ยน theme
  const handleDarkModeChange = (value: boolean) => {
    setIsDarkMode(value);
    setTheme(value ? "dark" : "light");
  };

  // จัดการการเลือกรูปโปรไฟล์
  const handleImageClick = () => {
    if (removeProfileImage) setRemoveProfileImage(false);
    fileInputRef.current?.click();
  };

  // จัดการการเปลี่ยนรูปโปรไฟล์
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setRemoveProfileImage(false);
    }
  };

  // ลบรูปโปรไฟล์
  const handleRemoveImage = () => {
    setRemoveProfileImage(true);
    setProfileImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // อัปเดตโปรไฟล์
  const handleUpdateProfile = async () => {
    if (!userName.trim()) {
      setProfileUpdateError("กรุณากรอกชื่อ");
      return;
    }

    setIsUpdatingProfile(true);
    setProfileUpdateError("");
    setProfileUpdateSuccess(false);

    try {
      const formData = new FormData();
      formData.append("name", userName);
      
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }
      
      formData.append("removeProfileImage", removeProfileImage.toString());

      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // อัปเดต session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            image: data.user.image
          }
        });

        setProfileUpdateSuccess(true);
        
        // รีเซ็ตสถานะ
        setProfileImage(null);
        setPreviewUrl(null);
        setRemoveProfileImage(false);

        // แสดงข้อความสำเร็จชั่วคราว
        setTimeout(() => {
          setProfileUpdateSuccess(false);
        }, 3000);
      } else {
        setProfileUpdateError(data.message || "ไม่สามารถอัปเดตโปรไฟล์ได้");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileUpdateError("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // ฟังก์ชันลบบัญชีผู้ใช้
  const handleDeleteAccount = async () => {
    if (!session?.user?.bkcId) {
      setDeleteError("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      // เรียก API สำหรับลบบัญชี
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bkcId: session.user.bkcId })
      });

      const data = await response.json();

      if (data.success) {
        // ปิด modal ยืนยัน
        onDeleteConfirmClose();
        // ปิด modal หลัก
        onOpenChange();
        // ล็อกเอาท์ผู้ใช้
        await signOut({ callbackUrl: '/login?deleted=true' });
      } else {
        setDeleteError(data.message || "ไม่สามารถลบบัญชีได้");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("เกิดข้อผิดพลาดในการลบบัญชี โปรดลองอีกครั้ง");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">การตั้งค่า</ModalHeader>
              <ModalBody>
                <Tabs aria-label="ตั้งค่า" color="primary" variant="underlined">
                  {/* แท็บโปรไฟล์ */}
                  <Tab 
                    key="profile" 
                    title={
                      <div className="flex items-center gap-2">
                        <FiUser />
                        <span>โปรไฟล์</span>
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-6 py-2">
                      {/* แสดงข้อความแจ้งเตือนความสำเร็จ/ล้มเหลว */}
                      {profileUpdateSuccess && (
                        <div className="bg-green-100 text-green-700 p-3 rounded-md flex items-center gap-2">
                          <FaCheck size={16} />
                          <span>อัปเดตโปรไฟล์สำเร็จ</span>
                        </div>
                      )}
                      
                      {profileUpdateError && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-md">
                          {profileUpdateError}
                        </div>
                      )}

                      {/* แสดงข้อมูลการล็อกอิน */}
                      <div className="flex flex-col items-center mb-3">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2 text-xs text-center w-full">
                          <p>เข้าสู่ระบบด้วย: <span className="font-bold">
                            {session?.user?.provider === 'line' ? 'LINE' : 'อีเมล'}
                          </span></p>
                          <p>{session?.user?.email}</p>
                          <p className="text-xs text-gray-500 mt-1">bkc_id: {session?.user?.bkcId}</p>
                        </div>
                      </div>

                      {/* รูปโปรไฟล์ */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div
                            className="relative w-24 h-24 rounded-full cursor-pointer overflow-hidden bg-gray-200/20 dark:bg-gray-200/5 flex items-center justify-center border-2 border-solid border-default-300"
                            onClick={handleImageClick}
                          >
                            {previewUrl ? (
                              <Image
                                src={previewUrl}
                                alt="ตัวอย่างโปรไฟล์"
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              removeProfileImage ? (
                                <AvatarIcon />
                              ) : (
                                session?.user?.image ? (
                                  <Image
                                    src={session.user.image}
                                    alt="รูปโปรไฟล์"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                  />
                                ) : (
                                  <AvatarIcon />
                                )
                              )
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <FaCamera size={24} className="text-white" />
                            </div>
                          </div>
                          
                          {/* ปุ่มลบรูปโปรไฟล์ */}
                          {(previewUrl || (!removeProfileImage && session?.user?.image)) && (
                            <Tooltip content="ลบรูปโปรไฟล์">
                              <Button
                                isIconOnly
                                color="danger"
                                size="sm"
                                variant="flat"
                                className="absolute -bottom-2 -right-2"
                                onPress={handleRemoveImage}
                              >
                                <FaTimes size={14} />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        
                        <p className="text-xs text-default-500">
                          คลิกที่รูปภาพเพื่ออัปโหลดรูปโปรไฟล์ใหม่
                        </p>
                      </div>

                      {/* ชื่อผู้ใช้ */}
                      <Input
                        label="ชื่อที่แสดง"
                        placeholder="กรอกชื่อที่ต้องการแสดง"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        variant="bordered"
                        startContent={<FaUserEdit className="text-default-400" />}
                        description="ชื่อนี้จะแสดงในโปรไฟล์และการโพสต์ของคุณ"
                      />

                      {/* ปุ่มบันทึกการเปลี่ยนแปลง */}
                      <Button 
                        color="primary" 
                        onPress={handleUpdateProfile}
                        isLoading={isUpdatingProfile}
                        startContent={!isUpdatingProfile && <FaCheck size={16} />}
                      >
                        {isUpdatingProfile ? "กำลังอัปเดต..." : "อัปเดตโปรไฟล์"}
                      </Button>
                    </div>
                  </Tab>
                  
                  {/* แท็บตั้งค่า */}
                  <Tab 
                    key="settings" 
                    title={
                      <div className="flex items-center gap-2">
                        <FiSettings />
                        <span>ตั้งค่า</span>
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-6 py-2">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                          <FaBell size={22} />
                          <span>การแจ้งเตือน</span>
                        </div>
                        <Switch
                          isSelected={notifications}
                          onValueChange={setNotifications}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                          <FaMoon size={22} />
                          <span>โหมดกลางคืน</span>
                        </div>
                        <Switch
                          isSelected={isDarkMode}
                          onValueChange={handleDarkModeChange}
                        />
                      </div>
                      
                      <Divider className="my-1" />
                      
                      <div className="mt-2">
                        <Button 
                          color="danger" 
                          variant="flat" 
                          startContent={<FaTrash />}
                          className="w-full" 
                          onPress={onDeleteConfirmOpen}
                        >
                          ลบบัญชีผู้ใช้
                        </Button>
                        <p className="text-tiny text-default-500 mt-1">
                          การลบบัญชีจะไม่สามารถกู้คืนได้ ข้อมูลทั้งหมดจะถูกลบออกจากระบบอย่างถาวร
                        </p>
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal ยืนยันการลบบัญชี */}
      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onOpenChange={onDeleteConfirmChange}
        size="sm"
      >
        <ModalContent>
          {(onDeleteConfirmClose) => (
            <>
              <ModalHeader className="flex flex-col items-center text-danger">
                <FaExclamationTriangle size={30} className="text-danger mb-2" />
                ยืนยันการลบบัญชี
              </ModalHeader>
              <ModalBody>
                <div className="text-center">
                  <p className="mb-3">คุณกำลังจะลบบัญชีของคุณอย่างถาวร</p>
                  <p className="font-bold mb-3">การกระทำนี้ไม่สามารถยกเลิกได้</p>
                  <p className="text-sm text-default-500">ข้อมูลทั้งหมดของคุณจะถูกลบออกจากระบบ</p>
                  
                  {deleteError && (
                    <div className="bg-red-100 text-danger p-2 rounded mt-3 text-sm">
                      {deleteError}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  className="flex-1" 
                  variant="flat" 
                  onPress={onDeleteConfirmClose}
                  autoFocus
                >
                  ยกเลิก
                </Button>
                <Button 
                  className="flex-1" 
                  color="danger"
                  isLoading={isDeleting}
                  onPress={handleDeleteAccount}
                >
                  ยืนยันการลบบัญชี
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}