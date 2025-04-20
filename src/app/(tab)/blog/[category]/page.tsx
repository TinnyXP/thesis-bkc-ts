import React from "react";
import { CategoryCardList } from "@/components";
import { getCategoryBySlug } from "@/lib/sanity";
import { Link } from "@heroui/react";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// กำหนด metadata แบบ dynamic จากข้อมูลหมวดหมู่
export async function generateMetadata(
  { params }: { params: { category: string } }
  // ลบพารามิเตอร์ parent เนื่องจากไม่ได้ใช้งาน
): Promise<Metadata> {
  // ดึงข้อมูลหมวดหมู่
  const category = await getCategoryBySlug(params.category);
  const categoryTitle = category?.title || "ไม่มีหมวดหมู่";

  return {
    title: `Bangkrajao - บทความในหมวดหมู่ ${categoryTitle}`,
    description: category?.description || `รวมบทความทั้งหมดในหมวดหมู่ ${categoryTitle}`,
  };
}

// Component แสดงข้อความเมื่อไม่พบหมวดหมู่
const CategoryNotFound = () => (
  <div className="container mx-auto max-w-5xl flex-grow px-4 my-10 flex flex-col items-center justify-center gap-6 min-h-[50vh] font-[family-name:var(--font-bai-jamjuree)]">
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">ไม่พบหมวดหมู่</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
        ขออภัย ไม่พบหมวดหมู่ที่คุณกำลังมองหา
      </p>
      <Link href="/blog" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
        กลับไปยังหน้าบทความ
      </Link>
    </div>
  </div>
);

/**
 * หน้าแสดงบทความตามหมวดหมู่
 */
export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  // ตรวจสอบว่ามีพารามิเตอร์หมวดหมู่หรือไม่
  if (!params.category) {
    notFound();
  }

  try {
    // ดึงข้อมูลหมวดหมู่
    const category = await getCategoryBySlug(params.category, {
      next: { revalidate: 60 }
    });

    // ถ้าไม่พบหมวดหมู่และไม่ใช่ "uncategorized"
    if (!category && params.category !== 'uncategorized') {
      return <CategoryNotFound />;
    }

    return (
      <section className="flex flex-col items-center gap-14 mt-5 mb-7">
        <h1 className="text-3xl font-bold">
          บทความในหมวดหมู่ {category?.title || 'ไม่มีหมวดหมู่'}
        </h1>
        <CategoryCardList category={params.category} />
      </section>
    );
  } catch (error) {
    console.error('Error fetching category:', error);
    return <CategoryNotFound />;
  }
}