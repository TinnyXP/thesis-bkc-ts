// ฟังก์ชันสำหรับการเชื่อมต่อกับ Sanity CMS และการดึงข้อมูล

import { createClient } from "next-sanity";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import imageUrlBuilder from "@sanity/image-url";
import { Post, Category } from "@/types";

// สร้าง Sanity client
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, 
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2023-05-03",
  useCdn: process.env.NEXT_PUBLIC_SANITY_USE_CDN === "true",
});

// ตัวสร้าง URL สำหรับรูปภาพจาก Sanity
const { projectId, dataset } = client.config();
export const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

// ตั้งค่า revalidation สำหรับ fetch options
export const defaultRevalidateOptions = { 
  next: { 
    revalidate: 60, // 60 วินาที
  } 
};

// ตั้งค่า revalidation เร็วขึ้นสำหรับข้อมูลที่มีการเปลี่ยนแปลงบ่อย
export const fastRevalidateOptions = { 
  next: { 
    revalidate: 10, // 10 วินาที
  } 
};

// คอลเลคชั่นของ queries สำหรับใช้งานกับ Sanity

/**
 * Query สำหรับดึงบทความทั้งหมด
 */
export const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current)
] | order(publishedAt desc)[0...12] {
  _id,
  title,
  slug,
  publishedAt,
  "categories": categories[]->{
    title,
    "slug": coalesce(slug.current, 'uncategorized')
  },
  mainImage {
    asset->{
      url,
      metadata { 
        lqip, 
        dimensions 
      }
    }
  }
}`;

/**
 * Query สำหรับดึงบทความตามหมวดหมู่
 */
export const CATEGORY_POSTS_QUERY = `*[
  _type == "post" && 
  defined(slug.current) &&
  $category in categories[]->slug.current
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  "categories": categories[]->{
    title,
    "slug": coalesce(slug.current, 'uncategorized')
  },
  mainImage {
    asset-> {
      _ref,
      url
    }
  }
}`;

/**
 * Query สำหรับดึงข้อมูลบทความเดียว
 */
export const POST_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  body,
  "categories": categories[]->{
    title,
    "slug": coalesce(slug.current, 'uncategorized')
  },
  "author": author->{
    name,
    image,
    slug,
    bio
  },
  mainImage {
    asset-> {
      _ref,
      url
    }
  }
}`;

/**
 * Query สำหรับดึงข้อมูลหมวดหมู่
 */
export const CATEGORY_QUERY = `*[_type == "category" && slug.current == $category][0]`;

/**
 * ฟังก์ชันสำหรับดึงบทความล่าสุด
 */
export async function getLatestPosts(limit: number = 12): Promise<Post[]> {
  try {
    const query = `*[
      _type == "post" && defined(slug.current)
    ] | order(publishedAt desc)[0...${limit}] {
      _id,
      title,
      slug,
      publishedAt,
      "categories": categories[]->{
        title,
        "slug": coalesce(slug.current, 'uncategorized')
      },
      mainImage {
        asset->{
          url
        }
      }
    }`;
    
    return await client.fetch<Post[]>(query, {}, defaultRevalidateOptions);
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับดึงบทความตามหมวดหมู่
 */
export async function getPostsByCategory(category: string): Promise<Post[]> {
  try {
    return await client.fetch<Post[]>(
      CATEGORY_POSTS_QUERY, 
      { category }, 
      defaultRevalidateOptions
    );
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลหมวดหมู่ทั้งหมด
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const query = `*[_type == "category"] {
      _id,
      title,
      "slug": coalesce(slug.current, 'uncategorized'),
      description
    }`;
    
    return await client.fetch<Category[]>(query, {}, defaultRevalidateOptions);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}