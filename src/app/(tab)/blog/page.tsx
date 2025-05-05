// src/app/(tab)/blog/page.tsx
import React from "react";
import { BlogCardList, PageHeader, SectionHeading } from "@/components";
import { Metadata } from "next";
import { getAllCategories } from "@/lib/sanity";
import Link from "next/link";
import { Card, CardBody, Divider } from "@heroui/react";
import { FaNewspaper, FaTags, FaBookOpen, FaThList } from "react-icons/fa";

// Metadata สำหรับหน้ารวมบทความ
export const metadata: Metadata = {
  title: "Bangkrajao - บทความทั้งหมด",
  description: "รวมบทความและข่าวสารเกี่ยวกับบางกะเจ้าทั้งหมด",
};

/**
 * หน้ารวมบทความทั้งหมด
 * แสดงหมวดหมู่และบทความล่าสุด
 */
export default async function BlogPage() {
  // ดึงข้อมูลหมวดหมู่ทั้งหมด
  const categories = await getAllCategories();

  return (
    <>
      <PageHeader 
        title="บทความเกี่ยวกับบางกะเจ้า"
        subtitle="ข่าวสาร"
        description="รวมบทความและข่าวสารน่าสนใจเกี่ยวกับบางกะเจ้า ปอดสีเขียวแห่งกรุงเทพฯ"
        buttons={{
          primary: {
            text: "ดูบทความล่าสุด",
            href: "#latest-articles",
            icon: <FaNewspaper />
          },
          secondary: {
            text: "ดูหมวดหมู่ทั้งหมด",
            href: "#categories",
            icon: <FaTags />
          }
        }}
      />

      <div className="container max-w-5xl mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* แสดงหมวดหมู่ในรูปแบบการ์ด */}
          <section id="categories" className="mb-12 pt-4 scroll-mt-24">
            <SectionHeading
              title="หมวดหมู่บทความ"
              subtitle="บทความ"
              icon={<FaTags className="text-primary-color" />}
              description="เลือกดูบทความตามหมวดหมู่ที่คุณสนใจ"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card
                  key={category._id}
                  isPressable
                  isHoverable
                  as={Link}
                  href={`/blog/${category.slug}`}
                  className="border-none shadow-md"
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <FaBookOpen className="text-primary-color text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{category.title}</h3>
                        {category.description && (
                          <p className="text-default-500 text-sm line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
              
              <Card
                isPressable
                isHoverable
                as={Link}
                href="/blog/uncategorized"
                className="border-none shadow-md"
              >
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <FaThList className="text-zinc-500 dark:text-zinc-400 text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">ไม่มีหมวดหมู่</h3>
                      <p className="text-default-500 text-sm">
                        บทความที่ยังไม่ได้จัดหมวดหมู่
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </section>
          
          <Divider className="my-8" />
          
          {/* แสดงบทความล่าสุด */}
          <section id="latest-articles" className="mb-8 scroll-mt-24">
            <SectionHeading
              title="บทความล่าสุด"
              subtitle="อัปเดตล่าสุด"
              icon={<FaNewspaper className="text-primary-color" />}
              description="บทความและข่าวสารล่าสุดเกี่ยวกับบางกะเจ้า"
            />
            
            <BlogCardList />
          </section>
        </div>
      </div>
    </>
  );
}