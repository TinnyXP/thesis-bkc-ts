// shared types for the application

/**
 * Post type interface
 * ใช้สำหรับข้อมูลบทความจาก Sanity CMS
 */
export interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  mainImage?: { 
    asset: { 
      url: string;
      _ref?: string;
      metadata?: {
        lqip?: string;
        dimensions?: {
          width: number;
          height: number;
        }
      }
    } 
  };
  categories: Category[];
  author?: Author;
  body?: any[]; // สำหรับ Portable Text
}

/**
 * Category type interface
 * ใช้สำหรับข้อมูลหมวดหมู่จาก Sanity CMS
 */
export interface Category {
  _id?: string;
  title: string;
  slug: string; // ใช้ string ตรงๆ เพราะใช้ coalesce ใน query
  description?: string;
}

/**
 * Author type interface
 * ใช้สำหรับข้อมูลผู้เขียนจาก Sanity CMS
 */
export interface Author {
  _id?: string;
  name: string;
  slug?: { current: string };
  image?: any; // Sanity image
  bio?: any[]; // Portable Text
}

/**
 * Air Quality data interface
 * ใช้สำหรับข้อมูลคุณภาพอากาศ
 */
export interface AirQuality {
  pm25: number;
  updatedAt: string;
}

/**
 * Image metadata interface
 * ใช้สำหรับข้อมูล metadata ของรูปภาพ
 */
export interface ImageMetadata {
  src: string;
  originalSrc?: string;
  alt: string;
  width?: number;
  height?: number;
}

/**
 * ShareButtonProps interface
 * ใช้สำหรับคอมโพเนนต์ปุ่มแชร์
 */
export interface ShareButtonProps {
  url: string;
  title: string;
}

/**
 * Navigation item interface
 * ใช้สำหรับรายการนำทางในเมนู
 */
export interface NavigationItem {
  label: string;
  href: string;
}

/**
 * Language option interface
 * ใช้สำหรับตัวเลือกภาษา
 */
export interface LanguageOption {
  key: string;
  display: string;
  name: string;
}