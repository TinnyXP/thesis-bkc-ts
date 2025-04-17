// src/components/ui/Sanity/CategoryCardList.tsx
"use client";

import { CategoryCard } from "@/components";
import { Link } from "@heroui/react";
import { usePosts } from "@/hooks/usePosts";

// Component แสดงข้อความเมื่อไม่พบบทความในหมวดหมู่
const EmptyCategory = ({ category }: { category: string }) => (
  <div className="container mx-auto max-w-5xl flex-grow px-4 my-10 flex flex-col items-center justify-center gap-6 min-h-[40vh]">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">ไม่มีบทความในหมวดหมู่นี้</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        ขออภัย ยังไม่มีบทความในหมวดหมู่ {category}
      </p>
      <Link href="/blog" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
        กลับไปยังหน้าบทความ
      </Link>
    </div>
  </div>
);

export default function CategoryCardList({ category }: { category: string }) {
  const { posts, isLoading, isError } = usePosts(category);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 dark:text-gray-400">
          กำลังโหลดบทความ...
        </p>
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
    return <EmptyCategory category={category} />;
  }

  return <CategoryCard posts={posts} category={category} />;
}