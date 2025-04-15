"use client";

import React, { useState } from "react";
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
} from "@heroui/react";
import { FaBell, FaMoon, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";

export interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export default function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark");
  
  // ใช้ useDisclosure สำหรับการควบคุม modal ยืนยันการลบบัญชี
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onOpenChange: onDeleteConfirmChange,
    onClose: onDeleteConfirmClose
  } = useDisclosure();

  // อัปเดต isDarkMode เมื่อ theme เปลี่ยน
  React.useEffect(() => {
    setIsDarkMode(theme === "dark");
  }, [theme]);

  // จัดการการเปลี่ยน theme
  const handleDarkModeChange = (value: boolean) => {
    setIsDarkMode(value);
    setTheme(value ? "dark" : "light");
  };

  // ฟังก์ชันลบบัญชีผู้ใช้
  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
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
        body: JSON.stringify({ userId: session.user.id })
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
                <div className="flex flex-col gap-6">
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
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  ปิด
                </Button>
                <Button color="primary" onPress={onClose}>
                  บันทึกการเปลี่ยนแปลง
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