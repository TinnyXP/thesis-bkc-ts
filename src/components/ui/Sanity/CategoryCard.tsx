"use client";

import React from "react";
import { Card, CardBody, CardFooter, Image, Pagination } from "@heroui/react";
import { Post, formatThaiDate } from "@/lib/sanity";

interface CategoryCardClientProps {
  posts: Post[];
  category: string;
}

/**
 * คอมโพเนนต์สำหรับแสดงบทความตามหมวดหมู่แบบ client-side
 */
export default function CategoryCard({ posts, category }: CategoryCardClientProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [cardsPerPage, setCardsPerPage] = React.useState(6);

  const totalCards = posts.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage);

  // ปรับจำนวนการ์ดต่อหน้าตามขนาดหน้าจอ
  React.useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth >= 1024) {
        setCardsPerPage(6);
      } else if (window.innerWidth >= 768) {
        setCardsPerPage(4);
      } else {
        setCardsPerPage(3);
      }
    };

    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  // ถ้าไม่มีบทความในหมวดหมู่
  if (!posts.length) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">ไม่พบบทความในหมวดหมู่นี้</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          ขออภัย ยังไม่มีบทความในหมวดหมู่ {category}
        </p>
      </div>
    );
  }

  // คำนวณบทความที่จะแสดงในหน้าปัจจุบัน
  const indexOfLastPost = currentPage * cardsPerPage;
  const indexOfFirstPost = indexOfLastPost - cardsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  return (
    <div className="flex flex-col items-center gap-5">      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPosts.map((post) => (
          <Card 
            key={post._id}
            isPressable 
            isBlurred
            onPress={() => window.location.href = `/blog/${category}/${post.slug.current}`}
            className="border-none bg-background/60 dark:bg-default-100/50"
          >
            <CardBody className="overflow-visible p-1.5">
              {post.mainImage?.asset?.url ? (
                <Image
                  alt={post.title}
                  className="object-cover rounded-xl w-full h-auto"
                  src={`${post.mainImage.asset.url}?w=768&auto=format`}
                  width={330}
                  height={180}
                />
              ) : (
                <div className="w-[330px] h-[180px] bg-zinc-200 rounded-xl flex items-center justify-center">
                  <p className="text-zinc-500 text-sm">No image available</p>
                </div>
              )}
            </CardBody>
            <CardFooter className="flex justify-between items-center">
              <div className="flex flex-col text-left">
                <p className="w-full max-w-[320px] truncate text-sm uppercase font-bold">
                  {post.title}
                </p>
                <small className="text-default-500">
                  {formatThaiDate(post.publishedAt)}
                </small>
              </div>
            </CardFooter>
          </Card>
        ))}
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