// src/hooks/usePosts.ts (แก้ไข)
import useSWR from 'swr';
import { Post } from '@/lib/sanity';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function usePosts(category?: string) {
  const url = category 
    ? `/api/posts/category/${category}` 
    : '/api/posts';
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 60000, // รีเฟรชทุก 60 วินาที
    revalidateOnFocus: true, // รีเฟรชเมื่อกลับมาที่แท็บ
    revalidateOnReconnect: true, // รีเฟรชเมื่อกลับมาออนไลน์
    dedupingInterval: 5000 // ป้องกันการเรียก API ซ้ำในช่วง 5 วินาที
  });

  // เรียงลำดับบทความตามวันที่อัปเดตล่าสุด
  const sortedPosts: Post[] = data?.posts
    ? [...data.posts].sort((a, b) => {
        const dateA = new Date(a._updatedAt || a.publishedAt).getTime();
        const dateB = new Date(b._updatedAt || b.publishedAt).getTime();
        return dateB - dateA; // เรียงจากใหม่ไปเก่า
      })
    : [];

  return {
    posts: sortedPosts,
    isLoading,
    isError: error,
    mutate // ฟังก์ชันสำหรับรีเฟรชข้อมูลแบบทันที
  };
}