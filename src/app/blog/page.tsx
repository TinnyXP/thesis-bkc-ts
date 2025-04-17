import React from "react";
import { BlogCardList } from "@/components";
import { Metadata } from "next";
import { getAllCategories } from "@/lib/sanity";
import Link from "next/link";

// Metadata สำหรับหน้ารวมบทความ
export const metadata: Metadata = {
  title: "Bangkrajao - บทความทั้งหมด",
  description: "รวมบทความและข่าวสารเกี่ยวกับบางกระเจ้าทั้งหมด",
};

/**
 * หน้ารวมบทความทั้งหมด
 * แสดงหมวดหมู่และบทความล่าสุด
 */
export default async function BlogPage() {
  // ดึงข้อมูลหมวดหมู่ทั้งหมด
  const categories = await getAllCategories();

  return (
    <div>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">บทความทั้งหมด</h1>
        
        {/* แสดงหมวดหมู่ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">หมวดหมู่</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link 
                key={category._id} 
                href={`/blog/${category.slug}`}
                className="px-4 py-2 bg-primary-color hover:bg-primary-color/80 text-white rounded-full transition-colors"
              >
                {category.title}
              </Link>
            ))}
            <Link 
              href="/blog/uncategorized"
              className="px-4 py-2 bg-zinc-500 hover:bg-zinc-600 text-white rounded-full transition-colors"
            >
              ไม่มีหมวดหมู่
            </Link>
          </div>
        </div>
        
        {/* แสดงบทความล่าสุด */}
        <div>
          <h2 className="text-xl font-semibold mb-4">บทความล่าสุด</h2>
          <BlogCardList />
        </div>
      </div>
    </div>
  );
}