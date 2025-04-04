// src/lib/sanity/schema.ts

interface SanityImageAsset {
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

interface SanityImage {
  asset: SanityImageAsset;
}

interface PortableTextBlock {
  _type: string;
  _key: string;
  [key: string]: unknown;
}

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
  mainImage?: SanityImage;
  categories: Category[];
  author?: Author;
  body?: PortableTextBlock[]; // สำหรับ Portable Text
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
  image?: SanityImage; // Sanity image
  bio?: PortableTextBlock[]; // Portable Text
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