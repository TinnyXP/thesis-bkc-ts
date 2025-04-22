// src/components/ui/Sanity/BlogCardList.tsx
"use client";

import { BlogCard, Loading } from "@/components";
import { usePosts } from "@/hooks/usePosts";

export default function BlogCardList() {
  const { posts, isLoading, isError } = usePosts();

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        <h2 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h2>
        <p>ไม่สามารถโหลดข้อมูลบทความได้ โปรดลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">ไม่พบบทความ</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          ขออภัย ยังไม่มีบทความในขณะนี้ โปรดกลับมาใหม่ในภายหลัง
        </p>
      </div>
    );
  }

  return <BlogCard posts={posts} />;
}