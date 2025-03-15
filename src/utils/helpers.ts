// ฟังก์ชันช่วยเหลือทั่วไปสำหรับใช้ในแอพพลิเคชัน

import { ImageMetadata } from "@/types";

/**
 * ฟอร์แมตวันที่เป็นรูปแบบไทย
 * @param dateString วันที่ในรูปแบบ string
 * @returns วันที่ในรูปแบบไทย "วัน เดือน ปี"
 */
export const formatThaiDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * สร้างชื่อไฟล์ที่ปลอดภัยสำหรับการดาวน์โหลด
 * @param name ชื่อไฟล์ต้นฉบับ
 * @returns ชื่อไฟล์ที่ปลอดภัย
 */
export const createSafeFileName = (name: string): string => {
  const cleanName = name
    .replace(/[^a-zA-Z0-9ก-๙]/g, '_')  // แทนที่อักขระพิเศษด้วย _
    .replace(/_{2,}/g, '_')            // รวม _ ที่ติดกัน
    .replace(/^_|_$/g, '');            // ลบ _ ที่อยู่หัวและท้าย

  return cleanName ? `${cleanName}_${Date.now()}.jpg` : `image_${Date.now()}.jpg`;
};

/**
 * เช็คว่าอุปกรณ์ปัจจุบันเป็นมือถือหรือไม่
 * @returns true ถ้าเป็นอุปกรณ์มือถือ
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

/**
 * คัดลอกข้อความไปยังคลิปบอร์ด
 * @param text ข้อความที่ต้องการคัดลอก
 * @returns Promise ที่แสดงสถานะการคัดลอก
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback สำหรับเบราว์เซอร์เก่า
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        console.error("Fallback copy failed:", err);
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};

/**
 * สร้าง URL สำหรับแชร์ไปยังโซเชียลมีเดีย
 * @param platform แพลตฟอร์มที่ต้องการแชร์ (facebook, twitter, line)
 * @param url URL ที่ต้องการแชร์
 * @param title หัวข้อสำหรับแชร์
 * @returns URL สำหรับแชร์
 */
export const createShareUrl = (platform: string, url: string, title: string): string => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case 'line':
      return `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`;
    default:
      return '';
  }
};

/**
 * กำหนดสีพื้นหลังตามค่า PM2.5
 * @param pm25 ค่า PM2.5
 * @returns classname สำหรับใช้กับ Tailwind CSS
 */
export const getAirQualityColorClass = (pm25: number): string => {
  if (pm25 <= 50) return "bg-green-500"; // ดี
  if (pm25 <= 100) return "bg-yellow-500"; // ปานกลาง
  if (pm25 <= 150) return "bg-orange-500"; // ไม่ดีสำหรับบางกลุ่ม
  if (pm25 <= 200) return "bg-red-500"; // ไม่ดี
  if (pm25 <= 300) return "bg-purple-500"; // อันตราย
  return "bg-pink-700"; // อันตรายมาก
};