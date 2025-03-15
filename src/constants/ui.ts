// ค่าคงที่สำหรับการใช้งานใน UI

import { NavigationItem, LanguageOption } from "@/types";

/**
 * รายการเมนูหลัก
 */
export const MAIN_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "ประวัติความเป็นมา",
    href: "/history"
  },
  {
    label: "สถานที่ท่องเที่ยว",
    href: "/attractions"
  },
  {
    label: "ข่าวสาร",
    href: "/blog"
  },
  {
    label: "สถิติ",
    href: "/statistics"
  },
];

/**
 * รายการภาษาที่รองรับ
 */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { key: "th", display: "TH", name: "ไทย" },
  { key: "en", display: "EN", name: "English" },
  { key: "zh", display: "CN", name: "中文" },
];

/**
 * โซเชียลมีเดียลิงก์
 */
export const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://facebook.com",
    className: "hover:bg-blue-600 hover:text-white",
    iconColor: "text-blue-600"
  },
  {
    name: "Youtube",
    href: "https://youtube.com",
    className: "hover:bg-red-600 hover:text-white",
    iconColor: "text-red-600"
  },
  {
    name: "Line",
    href: "https://line.me",
    className: "hover:bg-green-500 hover:text-white",
    iconColor: "text-green-500"
  },
];

/**
 * รายการเมนูในส่วน Footer
 */
export const FOOTER_NAVIGATION = {
  services: [
    { name: "ประวัติความเป็นมา", href: "/history" },
    { name: "ข้อมูลพื้นที่", href: "/area-info" },
    { name: "แผนที่", href: "/maps" },
    { name: "การเดินทาง", href: "/transportation" }
  ],
  attractions: [
    { name: "สถานที่ท่องเที่ยว", href: "/attractions" },
    { name: "ร้านอาหาร", href: "/restaurants" },
    { name: "ที่พัก", href: "/accommodations" },
    { name: "กิจกรรม", href: "/activities" },
  ],
  news: [
    { name: "ข่าวสารล่าสุด", href: "/blog" },
    { name: "กิจกรรมชุมชน", href: "/community-events" },
    { name: "การพัฒนาพื้นที่", href: "/development" },
    { name: "ประกาศ", href: "/announcements" },
  ],
  contact: [
    { name: "ติดต่อเรา", href: "/contact" },
    { name: "คำถามที่พบบ่อย", href: "/faq" },
    { name: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
    { name: "ข้อกำหนดการใช้งาน", href: "/terms" },
  ],
};

/**
 * ขนาดของ component ต่างๆ
 */
export const COMPONENT_SIZES = {
  SM: "sm" as "sm",
  MD: "md" as "md",
  LG: "lg" as "lg"
} as const;

/**
 * ระดับคุณภาพอากาศและข้อความที่เกี่ยวข้อง
 */
export const AIR_QUALITY_LEVELS = [
  { 
    maxValue: 50, 
    color: "bg-green-500", 
    textColor: "text-green-500",
    label: "ดี",
    description: "คุณภาพอากาศดี เหมาะสำหรับกิจกรรมกลางแจ้ง"
  },
  { 
    maxValue: 100, 
    color: "bg-yellow-500", 
    textColor: "text-yellow-500",
    label: "ปานกลาง",
    description: "คุณภาพอากาศปานกลาง ประชาชนที่ไวต่อมลพิษควรลดการออกกำลังกายกลางแจ้ง"
  },
  { 
    maxValue: 150, 
    color: "bg-orange-500", 
    textColor: "text-orange-500",
    label: "ไม่ดีสำหรับกลุ่มเสี่ยง",
    description: "ประชาชนกลุ่มเสี่ยงควรลดการออกกำลังกายกลางแจ้ง ประชาชนทั่วไปไม่จำเป็นต้องลดกิจกรรม"
  },
  { 
    maxValue: 200, 
    color: "bg-red-500", 
    textColor: "text-red-500",
    label: "ไม่ดี",
    description: "ประชาชนกลุ่มเสี่ยงควรงดการออกกำลังกายกลางแจ้ง ประชาชนทั่วไปควรลดการออกกำลังกายกลางแจ้ง"
  },
  { 
    maxValue: 300, 
    color: "bg-purple-500", 
    textColor: "text-purple-500",
    label: "อันตราย",
    description: "ประชาชนทุกคนควรหลีกเลี่ยงการออกกำลังกายกลางแจ้ง"
  },
  { 
    maxValue: Infinity, 
    color: "bg-pink-700", 
    textColor: "text-pink-700",
    label: "อันตรายมาก",
    description: "ประชาชนทุกคนควรหลีกเลี่ยงการออกนอกอาคาร"
  }
];