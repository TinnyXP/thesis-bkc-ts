// src/lib/sanity/helpers.ts
import { Post, Category } from './schema';

/**
 * แปลงวันที่เป็นรูปแบบไทย
 * @param date วันที่ในรูปแบบ string
 * @returns วันที่ในรูปแบบไทย
 */
export const formatThaiDate = (date: string): string => {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * จัดหมวดหมู่บทความตามหมวดหมู่
 * @param posts รายการบทความ
 * @returns บทความที่จัดหมวดหมู่แล้ว
 */
export const groupPostsByCategory = (posts: Post[]): Record<string, Post[]> => {
  return posts.reduce((acc: Record<string, Post[]>, post: Post) => {
    // ใช้หมวดหมู่แรกหรือ 'uncategorized' ถ้าไม่มีหมวดหมู่
    const categorySlug = post.categories && post.categories.length > 0
      ? post.categories[0].slug
      : 'uncategorized';
    
    if (!acc[categorySlug]) {
      acc[categorySlug] = [];
    }
    
    acc[categorySlug].push(post);
    return acc;
  }, {});
};

/**
 * สร้างข้อมูล metadata สำหรับบทความ
 * @param post ข้อมูลบทความ
 * @param baseUrl URL พื้นฐานของเว็บไซต์
 * @returns ข้อมูล metadata
 */
export const createPostMetadata = (post: Post, baseUrl: string) => {
  if (!post) return null;
  
  const categorySlug = post.categories?.[0]?.slug || 'uncategorized';
  const url = `${baseUrl}/blog/${categorySlug}/${post.slug.current}`;
  const imageUrl = post.mainImage?.asset?.url 
    ? `${post.mainImage.asset.url}?w=1200&h=630&fit=crop&auto=format`
    : null;
  
  return {
    title: post.title,
    description: post.excerpt || `บทความเรื่อง ${post.title}`,
    url,
    imageUrl,
    publishedAt: post.publishedAt,
    author: post.author?.name
  };
};

/**
 * กำหนดหมวดหมู่เริ่มต้นสำหรับบทความ
 * @param post ข้อมูลบทความ
 * @returns บทความที่มีหมวดหมู่เริ่มต้น
 */
export const setDefaultCategory = (post: Post): Post => {
  if (!post.categories || post.categories.length === 0) {
    const defaultCategory: Category = {
      title: 'ไม่มีหมวดหมู่',
      slug: 'uncategorized'
    };
    
    return {
      ...post,
      categories: [defaultCategory]
    };
  }
  
  return post;
};

/**
 * ค้นหาบทความที่เกี่ยวข้อง
 * @param currentPost บทความปัจจุบัน
 * @param allPosts บทความทั้งหมด
 * @param limit จำนวนบทความที่ต้องการ
 * @returns บทความที่เกี่ยวข้อง
 */
export const getRelatedPosts = (currentPost: Post, allPosts: Post[], limit: number = 3): Post[] => {
  if (!currentPost || !allPosts || allPosts.length === 0) {
    return [];
  }
  
  // ค้นหาบทความที่มีหมวดหมู่เดียวกัน
  const currentCategorySlug = currentPost.categories?.[0]?.slug || '';
  const relatedByCategory = allPosts.filter(post => 
    post._id !== currentPost._id && 
    post.categories?.some(cat => cat.slug === currentCategorySlug)
  );
  
  // ถ้ามีบทความที่เกี่ยวข้องน้อยกว่า limit ให้เพิ่มบทความล่าสุด
  if (relatedByCategory.length < limit) {
    const otherPosts = allPosts.filter(post => 
      post._id !== currentPost._id && 
      !relatedByCategory.some(relatedPost => relatedPost._id === post._id)
    );
    
    return [
      ...relatedByCategory,
      ...otherPosts.slice(0, limit - relatedByCategory.length)
    ];
  }
  
  // สุ่มบทความที่เกี่ยวข้อง
  return shuffleArray(relatedByCategory).slice(0, limit);
};

/**
 * สลับตำแหน่งสมาชิกในอาร์เรย์
 * @param array อาร์เรย์ที่ต้องการสลับตำแหน่ง
 * @returns อาร์เรย์ที่สลับตำแหน่งแล้ว
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  
  return newArray;
};