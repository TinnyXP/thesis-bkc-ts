// src/lib/dateUtils.ts

/**
 * แปลงวันที่เป็นข้อความแสดงระยะเวลาที่ผ่านมา
 * เช่น "เมื่อ 5 นาทีที่แล้ว", "เมื่อวานนี้", "3 วันที่แล้ว"
 * @param dateString - วันที่ในรูปแบบ ISO string หรือ Date object
 * @returns ข้อความแสดงระยะเวลาที่ผ่านมา
 */
export function formatRelativeTime(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    
    // แปลงเป็นหน่วยต่างๆ
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
  
    // ตรวจสอบว่าเป็นวันเดียวกันหรือไม่
    const isToday = date.toDateString() === now.toDateString();
    
    // ตรวจสอบว่าเป็นเมื่อวานหรือไม่
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
  
    // แสดงผลตามกรณีต่างๆ
    if (diffInSeconds < 60) {
      return 'เมื่อสักครู่';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInHours < 24 && isToday) {
      return `${diffInHours} ชั่วโมงที่แล้ว`;
    } else if (isYesterday) {
      return 'เมื่อวานนี้';
    } else if (diffInDays < 7) {
      return `${diffInDays} วันที่แล้ว`;
    } else if (diffInMonths < 1) {
      return `${Math.ceil(diffInDays / 7)} สัปดาห์ที่แล้ว`;
    } else if (diffInYears < 1) {
      return `${diffInMonths} เดือนที่แล้ว`;
    } else {
      return `${diffInYears} ปีที่แล้ว`;
    }
  }
  
  /**
   * แปลงวันที่เป็นข้อความแสดงวันที่แบบย่อในรูปแบบ "DD/MM/YYYY"
   * @param dateString - วันที่ในรูปแบบ ISO string หรือ Date object
   * @returns ข้อความวันที่แบบย่อ
   */
  export function formatShortDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  /**
   * แปลงวันที่เป็นข้อความแสดงวันที่และเวลา
   * @param dateString - วันที่ในรูปแบบ ISO string หรือ Date object
   * @returns ข้อความวันที่และเวลา
   */
  export function formatDateTime(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }