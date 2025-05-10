// src/lib/sanity/queries.ts
import { client } from './client';
import { defaultRevalidateOptions } from './client';
import { Post, Category } from './schema';

/**
 * Query สำหรับดึงบทความทั้งหมด
 */
export const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current)
] | order(coalesce(_updatedAt, publishedAt) desc) {
  _id,
  title,
  slug,
  publishedAt,
  _updatedAt,
  excerpt,
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
  excerpt,
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
  excerpt,
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
  },
  youtubeUrl,
  audioFile {
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
 * Query สำหรับดึงข้อมูลหมวดหมู่ทั้งหมด
 */
export const ALL_CATEGORIES_QUERY = `*[_type == "category"] {
  _id,
  title,
  "slug": coalesce(slug.current, 'uncategorized'),
  description
}`;

/**
 * ฟังก์ชันสำหรับดึงบทความล่าสุด
 * @param limit จำนวนบทความที่ต้องการดึง
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Post[]>
 */
export async function getLatestPosts(limit?: number, options = defaultRevalidateOptions): Promise<Post[]> {
  try {
    // ถ้าไม่มีการระบุ limit ให้ดึงทั้งหมด
    const limitClause = limit ? `[0...${limit}]` : '';
    
    const query = `*[
      _type == "post" && defined(slug.current)
    ] | order(coalesce(_updatedAt, publishedAt) desc)${limitClause} {
      _id,
      title,
      slug,
      publishedAt,
      _updatedAt,
      excerpt,
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
    
    return await client.fetch<Post[]>(query, {}, options);
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับดึงบทความตามหมวดหมู่
 * @param category ชื่อหมวดหมู่
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Post[]>
 */
export async function getPostsByCategory(category: string, options = defaultRevalidateOptions): Promise<Post[]> {
  try {
    return await client.fetch<Post[]>(
      CATEGORY_POSTS_QUERY, 
      { category }, 
      options
    );
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลบทความตาม slug
 * @param slug slug ของบทความ
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Post | null>
 */
export async function getPostBySlug(slug: string, options = defaultRevalidateOptions): Promise<Post | null> {
  try {
    return await client.fetch<Post | null>(
      POST_QUERY,
      { slug },
      options
    );
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลหมวดหมู่
 * @param slug slug ของหมวดหมู่
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Category | null>
 */
export async function getCategoryBySlug(slug: string, options = defaultRevalidateOptions): Promise<Category | null> {
  try {
    return await client.fetch<Category | null>(
      CATEGORY_QUERY,
      { category: slug },
      options
    );
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลหมวดหมู่ทั้งหมด
 * @param options ตัวเลือกสำหรับการ revalidate
 * @returns Promise<Category[]>
 */
export async function getAllCategories(options = defaultRevalidateOptions): Promise<Category[]> {
  try {
    return await client.fetch<Category[]>(ALL_CATEGORIES_QUERY, {}, options);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}