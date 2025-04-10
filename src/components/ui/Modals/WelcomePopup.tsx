'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@heroui/react";
import { useSession } from 'next-auth/react';
import { FaCheckCircle } from 'react-icons/fa';

const WelcomePopup = () => {
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่ามี session และยังไม่เคยแสดง popup
    if (session?.user?.name && !hasShownWelcome) {
      // ตรวจสอบว่าเป็นการเข้าสู่ระบบครั้งแรกหรือไม่จาก localStorage
      const isFirstLogin = localStorage.getItem('firstLogin') !== 'false';
      
      if (isFirstLogin) {
        // ตั้งค่าเป็น false เพื่อไม่ให้แสดงอีกในการเข้าสู่ระบบครั้งถัดไป
        localStorage.setItem('firstLogin', 'false');
        
        // เปิด popup หลังจากโหลดหน้าเสร็จเล็กน้อย
        setTimeout(() => {
          onOpen();
          setHasShownWelcome(true);
        }, 1000);
      }
    }
  }, [session, hasShownWelcome, onOpen]);

  if (!session) return null;

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
                สวัสดีคุณ <strong>{session.user.name}</strong> 🎉
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