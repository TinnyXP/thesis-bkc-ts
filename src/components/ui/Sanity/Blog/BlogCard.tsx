"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody, CardFooter, Chip, Image, Pagination } from "@heroui/react";
import { Post, formatThaiDate } from "@/lib/sanity";

interface CardClientProps {
  posts: Post[];
}

/**
 * คอมโพเนนต์แสดงการ์ดบทความพร้อมการแบ่งหน้า (client-side)
 */
export default function BlogCard({ posts }: CardClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(6);
  const [currentPosts, setCurrentPosts] = useState<Post[]>([]);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(posts.length / cardsPerPage);

  // ปรับจำนวนการ์ดต่อหน้าตามขนาดหน้าจอ
  useEffect(() => {
    const updateCardsPerPage = () => {
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

  // อัพเดท posts ที่แสดงเมื่อมีการเปลี่ยนหน้าหรือจำนวนการ์ดต่อหน้า
  useEffect(() => {
    const indexOfLastPost = currentPage * cardsPerPage;
    const indexOfFirstPost = indexOfLastPost - cardsPerPage;
    setCurrentPosts(posts.slice(indexOfFirstPost, indexOfLastPost));
  }, [currentPage, cardsPerPage, posts]);

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
          // ถ้าไม่มี category หรือไม่มี slug ให้ใช้ uncategorized
          const categorySlug = post.categories?.[0]?.slug || 'uncategorized';

          return (
            <Card
              key={post._id}
              isPressable
              isBlurred
              isHoverable
              onPress={() => window.location.href = `/blog/${categorySlug}/${post.slug.current}`}
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
                    <Chip size="sm" color="primary" variant="solid"
                      classNames={{
                        base: "bg-gradient-to-br from-primary to-emerald-600",
                        content: "text-white",
                      }}
                    >
                      {post.categories?.[0]?.title || 'ไม่มีหมวดหมู่'}
                    </Chip>
                  </div>
                </div>
              </CardBody>
              <CardFooter className="flex justify-between items-center">
                <div className="flex flex-col text-left">
                  <p className="w-full max-w-[320px] overflow-hidden text-ellipsis text-sm uppercase font-bold line-clamp-1">{post.title}</p>
                  <div className="flex items-center gap-2">
                    <small className="text-default-500">
                      {formatThaiDate(post.publishedAt)}
                    </small>
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {totalPages > 1 && (
        <Pagination 
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