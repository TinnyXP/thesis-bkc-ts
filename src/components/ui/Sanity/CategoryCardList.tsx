// src/components/ui/Cards/SanityCards/Category/CategoryCardServer.tsx
import { CategoryCard } from "@/components";
import { Link } from "@heroui/react";
import { getPostsByCategory } from "@/lib/sanity";

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

/**
 * คอมโพเนนต์สำหรับแสดงบทความตามหมวดหมู่
 */
export default async function CategoryCardList({ category }: { category: string }) {
  try {
    // ดึงบทความตามหมวดหมู่
    const posts = await getPostsByCategory(category);
    
    // หากไม่มีบทความในหมวดหมู่
    if (!posts || posts.length === 0) {
      return <EmptyCategory category={category} />;
    }

    // ส่งข้อมูลไปให้ CategoryCard แสดงผล
    return <CategoryCard posts={posts} category={category} />;
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return <EmptyCategory category={category} />;
  }
}