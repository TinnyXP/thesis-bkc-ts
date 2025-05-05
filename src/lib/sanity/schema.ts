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
  body?: PortableTextBlock[];
  youtubeUrl?: string;
  audioFile?: {
    asset?: {
      _ref: string;
      url: string;
    }
  };
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

// สำหรับพิกัด Geolocation
export interface GeoPoint {
  _type: 'geopoint';
  lat?: number;
  lng?: number;
  alt?: number;   // ความสูง (Altitude)
}
// สำหรับข้อมูลการติดต่อ
export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  line?: string;
}

// สำหรับเวลาทำการ
export interface OperatingHour {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'holiday';
  open: string;
  close: string;
  isClosed: boolean;
}

// สำหรับราคาค่าเข้าชม
export interface PricingItem {
  type: string;
  price: number;
  description?: string;
}

// สำหรับสถานที่ท่องเที่ยว
export interface Place {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  mainImage?: SanityImage;
  gallery?: SanityImage[];
  body?: PortableTextBlock[];
  placeType?: PlaceType;
  location?: GeoPoint;
  address?: string;
  district?: District;
  contactInfo?: ContactInfo;
  operatingHours?: OperatingHour[];
  pricing?: PricingItem[];
  facilities?: string[];
  activities?: string[];
  bestTimeToVisit?: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
  // เพิ่มฟิลด์สำหรับวิดีโอและไฟล์เสียง
  youtubeUrl?: string;
  audioFile?: {
    asset?: {
      _ref: string;
      url: string;
    }
  };
}

// สำหรับประเภทสถานที่
export interface PlaceType {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  icon?: string;
}

// สำหรับตำบล/พื้นที่
export interface District {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  mainImage?: SanityImage;
}