// src/lib/accountStatusChecker.ts
import { getSession } from "next-auth/react";

/**
 * ตรวจสอบสถานะบัญชีผู้ใช้
 * @returns ข้อมูลสถานะบัญชี (isActive, isLoggedIn)
 */
export async function checkAccountStatus(): Promise<{ isActive: boolean; isLoggedIn: boolean; message?: string }> {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
    const session = await getSession();
    
    if (!session) {
      return { isActive: false, isLoggedIn: false };
    }

    // เรียก API ตรวจสอบสถานะบัญชี
    const response = await fetch('/api/user/check-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    return {
      isActive: data.isActive === true,
      isLoggedIn: true,
      message: data.message
    };
  } catch (error) {
    console.error('Error checking account status:', error);
    // ถ้าเกิดข้อผิดพลาด ให้ถือว่าบัญชียังใช้งานได้ เพื่อไม่ให้ผู้ใช้ถูกล็อกเอาท์โดยไม่จำเป็น
    return { isActive: true, isLoggedIn: true };
  }
}

/**
 * ตรวจสอบสถานะบัญชีเป็นประจำ
 * @param interval ระยะเวลาในการตรวจสอบ (มิลลิวินาที) ค่าเริ่มต้นคือ 5 นาที
 * @param onStatusChange ฟังก์ชันที่จะเรียกเมื่อสถานะบัญชีเปลี่ยน
 * @returns ฟังก์ชันสำหรับยกเลิกการตรวจสอบ
 */
export function setupAccountStatusChecker(
  interval: number = 5 * 60 * 1000,
  onStatusChange?: (status: { isActive: boolean; isLoggedIn: boolean; message?: string }) => void
): () => void {
  let timerId: NodeJS.Timeout;
  let previousStatus = { isActive: true, isLoggedIn: true };

  // ฟังก์ชันตรวจสอบสถานะ
  const checkStatus = async () => {
    const currentStatus = await checkAccountStatus();
    
    // ตรวจสอบว่าสถานะเปลี่ยนไปหรือไม่
    if (previousStatus.isActive !== currentStatus.isActive || 
        previousStatus.isLoggedIn !== currentStatus.isLoggedIn) {
      // เรียกฟังก์ชันที่ส่งมาเมื่อสถานะเปลี่ยน
      if (onStatusChange) {
        onStatusChange(currentStatus);
      }
      previousStatus = currentStatus;
    }
    
    // ตั้ง timer สำหรับตรวจสอบครั้งถัดไป
    timerId = setTimeout(checkStatus, interval);
  };

  // เริ่มต้นตรวจสอบ
  timerId = setTimeout(checkStatus, interval);

  // ส่งคืนฟังก์ชันสำหรับยกเลิกการตรวจสอบ
  return () => {
    if (timerId) {
      clearTimeout(timerId);
    }
  };
}