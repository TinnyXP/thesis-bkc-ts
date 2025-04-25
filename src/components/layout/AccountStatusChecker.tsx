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

  // แก้ไขให้ระบุสาเหตุที่ชัดเจนเมื่อบัญชีมีปัญหา
  useEffect(() => {
    // ทำงานเฉพาะเมื่อผู้ใช้เข้าสู่ระบบแล้ว
    if (status === "authenticated") {

      // ตั้งค่าตัวตรวจสอบสถานะบัญชี
      const cancelChecker = setupAccountStatusChecker(
        1 * 60 * 1000, // ตรวจสอบทุก 1 นาที
        async (status) => {
          // เรียกเมื่อสถานะบัญชีเปลี่ยน
          if (!status.isActive && status.isLoggedIn) {
            // ข้อความที่มีรายละเอียดเพิ่มเติม
            let message = "บัญชีของคุณไม่สามารถเข้าถึงได้";
            let redirectUrl = "/login?status=blocked";

            // ตรวจสอบรายละเอียดเพิ่มเติมจากข้อความที่ส่งมา
            if (status.message) {
              if (status.message.includes("ถูกระงับ")) {
                message = "บัญชีของคุณถูกระงับการใช้งานชั่วคราว โปรดติดต่อผู้ดูแลระบบ";
                redirectUrl = "/login?status=suspended";
              } else if (status.message.includes("ถูกลบ") || status.message.includes("ไม่พบบัญชี")) {
                message = "บัญชีของคุณถูกลบออกจากระบบ ไม่สามารถเข้าใช้งานได้อีก";
                redirectUrl = "/login?status=deleted";
              }
            }

            // แสดงข้อความที่เฉพาะเจาะจง
            showToast(message, "error");

            // รอ 3 วินาที ให้ผู้ใช้ได้เห็น toast ก่อน
            await new Promise(resolve => setTimeout(resolve, 3000));

            // ล็อกเอาท์พร้อมระบุสถานะที่ชัดเจน
            await signOut({ redirect: true, callbackUrl: redirectUrl });
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