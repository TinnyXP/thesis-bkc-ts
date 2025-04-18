// src/lib/sanity/helpers.ts
import { Post, Category } from './schema';
// import { PortableTextBlock } from '@portabletext/types';

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
  
  // สร้าง excerpt สำหรับ meta description
  let excerpt = post.excerpt || '';
  
  // ถ้าไม่มี excerpt ให้ใช้ส่วนต้นของ body
  if (!excerpt && post.body) {
    // สกัดเนื้อความจาก body (body เป็น array ของ PortableTextBlock)
    excerpt = '';
    
    if (Array.isArray(post.body)) {
      for (const block of post.body) {
        // ตรวจสอบว่าเป็น block ข้อความและมี children ที่เป็น array
        if (block._type === 'block' && Array.isArray(block.children)) {
          for (const child of block.children) {
            // ตรวจสอบว่าเป็น span ที่มีข้อความ
            if (child._type === 'span' && typeof child.text === 'string') {
              excerpt += child.text + ' ';
              if (excerpt.length > 150) break;
            }
          }
          if (excerpt.length > 150) break;
        }
      }
    }
    
    // ตัดให้ความยาวเหมาะสมและเพิ่ม ... ท้ายข้อความ
    if (excerpt.length > 160) {
      excerpt = excerpt.substring(0, 157) + '...';
    }
  }
  
  // เพิ่ม schema.org ในรูปแบบ JSON-LD สำหรับ Article
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'image': imageUrl ? [imageUrl] : [],
    'datePublished': post.publishedAt,
    // ไม่มี updatedAt ใน Post type ใช้ publishedAt แทน
    'dateModified': post.publishedAt,
    'author': post.author ? {
      '@type': 'Person',
      'name': post.author.name
    } : undefined,
    'publisher': {
      '@type': 'Organization',
      'name': 'บางกระเจ้า',
      'logo': {
        '@type': 'ImageObject',
        'url': `${baseUrl}/Bkj_logo.svg`
      }
    },
    'description': excerpt || `บทความเรื่อง ${post.title}`,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': url
    }
  };
  
  return {
    title: post.title,
    description: excerpt || `บทความเรื่อง ${post.title}`,
    url,
    imageUrl,
    publishedAt: post.publishedAt,
    author: post.author?.name,
    jsonLd: JSON.stringify(jsonLd)
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