"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { setupAccountStatusChecker } from "@/lib/accountStatusChecker";
import { showToast } from "@/lib/toast";

/**
 * คอมโพเนนท์สำหรับตรวจสอบสถานะบัญชีเป็นประจำ
 * - ใช้ในระดับ Layout ของแอพพลิเคชัน
 * - จะตรวจสอบสถานะบัญชีทุก 5 นาที
 * - ถ้าบัญชีถูกระงับ จะแสดง toast และล็อกเอาท์
 */
export default function AccountStatusChecker() {
  const { status } = useSession();

  useEffect(() => {
    // ทำงานเฉพาะเมื่อผู้ใช้เข้าสู่ระบบแล้ว
    if (status === "authenticated") {
      // ตั้งค่าตัวตรวจสอบสถานะบัญชี
      const cancelChecker = setupAccountStatusChecker(
        5 * 60 * 1000, // ตรวจสอบทุก 5 นาที
        async (status) => {
          // เรียกเมื่อสถานะบัญชีเปลี่ยน
          if (!status.isActive && status.isLoggedIn) {
            // ถ้าบัญชีถูกระงับ
            showToast(
              status.message || "บัญชีของคุณถูกระงับการใช้งาน โปรดติดต่อผู้ดูแลระบบ",
              "error"
            );
            
            // รอ 3 วินาที ให้ผู้ใช้ได้เห็น toast ก่อน
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // ล็อกเอาท์
            await signOut({ redirect: true, callbackUrl: "/login?status=suspended" });
          }
        }
      );

      // ยกเลิกการตรวจสอบเมื่อคอมโพเนนท์ถูกทำลาย
      return () => {
        cancelChecker();
      };
    }
  }, [status]);

  // คอมโพเนนท์นี้ไม่มีการแสดงผลใดๆ (ทำงานเบื้องหลัง)
  return null;
}