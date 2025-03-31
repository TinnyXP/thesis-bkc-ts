// src/lib/sanity/schema.ts

/**
 * Post type interface
 * ใช้สำหรับข้อมูลบทความจาก Sanity CMS
 */
export interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt?: string;
  mainImage?: { 
    asset: { 
      _ref?: string;
      url: string;
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
 * SanityConfig type interface
 * ใช้สำหรับค่า configuration ของ Sanity
 */
export interface SanityConfig {
  projectId: string | undefined;
  dataset: string | undefined;
  apiVersion: string;
  useCdn: boolean;
}

/**
 * RevalidateOptions type interface
 * ใช้สำหรับค่า revalidate ใน fetch options
 */
export interface RevalidateOptions {
  next: {
    revalidate: number;
  };
}