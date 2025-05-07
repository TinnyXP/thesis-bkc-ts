"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardFooter, Chip, Image, Pagination } from "@heroui/react";
import { FaCalendarAlt } from "react-icons/fa";
import { Post } from "@/lib/sanity/schema";
import dayjs from "dayjs";
import "dayjs/locale/th";

import { ViewCounter } from "@/components";

// ตั้งค่าภาษาไทยสำหรับ dayjs
dayjs.locale("th");

interface BlogCardProps {
  posts: Post[];
  category?: string; // เพิ่ม category เป็น optional
}

/**
 * คอมโพเนนต์แสดงการ์ดบทความพร้อมการแบ่งหน้า (client-side)
 */
export default function BlogCard({ posts }: BlogCardProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cardsPerPage, setCardsPerPage] = useState<number>(6);
  const [currentPosts, setCurrentPosts] = useState<Post[]>([]);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(posts.length / cardsPerPage);

  // ปรับจำนวนการ์ดต่อหน้าตามขนาดหน้าจอ
  useEffect(() => {
    const updateCardsPerPage = (): void => {
      if (window.innerWidth >= 1024) {
        setCardsPerPage(6); // large screens
      } else if (window.innerWidth >= 768) {
        setCardsPerPage(4); // medium screens
      } else {
        setCardsPerPage(3); // small screens
      }
    };

    // เรียกใช้งานครั้งแรกและเมื่อมีการ resize
    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);

    // Cleanup
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  // อัพเดต posts ที่แสดงเมื่อมีการเปลี่ยนหน้าหรือจำนวนการ์ดต่อหน้า
  useEffect(() => {
    const indexOfLastPost = currentPage * cardsPerPage;
    const indexOfFirstPost = indexOfLastPost - cardsPerPage;
    setCurrentPosts(posts.slice(indexOfFirstPost, indexOfLastPost));
  }, [currentPage, cardsPerPage, posts]);

  // ฟังก์ชันสำหรับพิจารณาว่าควรแสดงข้อความ "ล่าสุด" หรือวันที่
  const getDateLabel = (post: Post): string => {
    const updatedDate = post._updatedAt || post.publishedAt;
    if (!updatedDate) return "";

    const now = dayjs();
    const date = dayjs(updatedDate);
    const diffDays = now.diff(date, 'day');

    if (diffDays < 1) return "วันนี้ • ";
    if (diffDays < 2) return "เมื่อวาน • ";
    if (diffDays < 7) return "";

    return "";
  };

  // ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
  const formatDate = (post: Post): string => {
    const dateString = post._updatedAt || post.publishedAt;
    if (!dateString) return "";

    return dayjs(dateString).format("D MMMM YYYY");
  };

  // ถ้าไม่มีข้อมูลบทความ
  if (!posts.length) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">ไม่พบบทความ</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          ขออภัย ยังไม่มีบทความในหมวดหมู่นี้
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPosts.map((post) => {
          // ดึงข้อมูลหมวดหมู่และสร้าง URL
          const categorySlug = post.categories?.[0]?.slug || 'uncategorized';
          const categoryTitle = post.categories?.[0]?.title || 'ไม่มีหมวดหมู่';
          const postUrl = `/blog/${categorySlug}/${post.slug.current}`;

          return (
            <Card
              key={post._id}
              isPressable
              isBlurred
              isHoverable
              as={Link}
              href={postUrl}
              className="border-none bg-background/60 dark:bg-default-100/50"
            >
              <CardBody className="overflow-visible px-1.5 pt-1.5 pb-0">
                <div className="relative">
                  {post.mainImage?.asset?.url ? (
                    <Image
                      alt={post.title}
                      className="object-cover rounded-xl w-full h-auto aspect-video"
                      src={`${post.mainImage.asset.url}?w=768&auto=format`}
                      width={330}
                      height={180}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-[180px] aspect-video bg-zinc-500/10 rounded-xl flex items-center justify-center">
                      <p className="text-foreground text-sm">ไม่มีรูปภาพ</p>
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex gap-2 z-10">
                    <Chip size="sm" color="primary" variant="solid">
                      {categoryTitle}
                    </Chip>
                  </div>
                </div>
              </CardBody>
              <CardFooter className="flex justify-between items-start">
                <div className="flex flex-col text-left">
                  <p className="w-full max-w-[320px] overflow-hidden text-ellipsis text-sm uppercase font-bold line-clamp-1">{post.title}</p>

                  <div className="flex items-center gap-1 mt-1 text-default-400">
                    <FaCalendarAlt size={12} />
                    <span className="text-xs">
                      {getDateLabel(post)}{formatDate(post)}
                    </span>
                  </div>
                  
                  {/* เพิ่ม ViewCounter ที่นี่ */}
                  <ViewCounter
                    pageType="blog"
                    slug={post.slug.current}
                    className="text-xs flex items-center gap-1"
                  />
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          showControls
          variant="light"
          initialPage={1}
          total={totalPages}
          page={currentPage}
          onChange={setCurrentPage}
          classNames={{ item: "box-border" }}
        />
      )}
    </div>
  );
}