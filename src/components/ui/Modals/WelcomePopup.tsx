'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@heroui/react";
import { useMockAuth } from '@/lib/auth/mockAuthContext';
import { FaCheckCircle } from 'react-icons/fa';

const WelcomePopup = () => {
  const { user, isAuthenticated } = useMockAuth();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    // ถ้ามีการเข้าสู่ระบบและยังไม่เคยแสดง popup
    if (isAuthenticated && user?.name && !hasShownWelcome) {
      // ตรวจสอบว่าเป็นการเข้าสู่ระบบครั้งแรกหรือไม่จาก localStorage
      const isFirstLogin = localStorage.getItem('firstLogin') === 'true';
      
      if (isFirstLogin) {
        // เปิด popup หลังจากโหลดหน้าเสร็จเล็กน้อย
        setTimeout(() => {
          onOpen();
          setHasShownWelcome(true);
          // ล้างค่า firstLogin เพื่อไม่ให้แสดงอีก
          localStorage.removeItem('firstLogin');
        }, 1000);
      }
    }
  }, [isAuthenticated, user, hasShownWelcome, onOpen]);

  // ถ้าไม่มี session ไม่ต้องทำอะไร
  if (!isAuthenticated) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-primary-color text-2xl" />
                <span>ยินดีต้อนรับ!</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <p>
                สวัสดีคุณ <strong>{user?.name}</strong> 🎉
              </p>
              <p>
                ขอบคุณที่เข้ามาเป็นส่วนหนึ่งของชุมชนบางกระเจ้า เรายินดีต้อนรับคุณเข้าสู่เว็บไซต์ของเรา
              </p>
              <p>
                คุณสามารถจัดการโปรไฟล์ของคุณได้ทุกเมื่อโดยคลิกที่ไอคอนโปรไฟล์ที่มุมขวาบนของหน้าจอ
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                เริ่มต้นใช้งาน
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default WelcomePopup;