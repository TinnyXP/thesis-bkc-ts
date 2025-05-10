// src/components/ui/Sanity/Blog/CategoryCardList.tsx
"use client";

import React, { useState, useCallback } from "react";
import { BlogCard, SearchBar } from "@/components";
import { Link } from "@heroui/react";
import { usePosts } from "@/hooks/usePosts";
import { Post } from "@/lib/sanity/schema";

// Component แสดงข้อความเมื่อไม่พบบทความในหมวดหมู่
const EmptyCategory = ({ category }: { category: string }) => (
  <div className="container mx-auto max-w-5xl flex-grow px-4 my-10 flex flex-col items-center justify-center gap-6 min-h-[40vh]">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">ไม่มีบทความในหมวดหมู่นี้</h2>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
        ขออภัย ยังไม่มีบทความในหมวดหมู่ {category}
      </p>
      <Link href="/blog" color="primary" className="text-white font-bold py-3 px-6 rounded-lg transition-colors">
        กลับไปยังหน้าบทความ
      </Link>
    </div>
  </div>
);

interface CategoryCardListProps {
  category: string;
  showSearchBar?: boolean;
}

export default function CategoryCardList({ category, showSearchBar = true }: CategoryCardListProps) {
  const { posts, isLoading, isError } = usePosts(category);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // ฟังก์ชันค้นหา
  const handleSearch = useCallback((query: string) => {
    // อัพเดท state searchQuery ทุกครั้งที่มีการค้นหา
    setSearchQuery(query);
    
    if (!query.trim()) {
      // กรณีค่าว่าง: ล้างการค้นหา กลับไปแสดงทั้งหมด
      setFilteredPosts([]);
      setHasSearched(false);
      return;
    }
    
    // กรณีมีคำค้นหา: ตั้งค่า hasSearched เป็น true เสมอเมื่อมีการเรียกฟังก์ชัน handleSearch
    setHasSearched(true);
    
    // กรองบทความตามชื่อหรือคำอธิบาย
    const lowerCaseQuery = query.toLowerCase();
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(lowerCaseQuery) || 
      (post.excerpt && post.excerpt.toLowerCase().includes(lowerCaseQuery))
    );
    
    // อัพเดทผลลัพธ์การค้นหา
    setFilteredPosts(filtered);
  }, [posts]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-zinc-600 dark:text-zinc-400">
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

  return (
    <div>
      {showSearchBar && (
        <div className="mb-6">
          <SearchBar 
            onSearch={handleSearch}
            contentType="blog"
            placeholder={`ค้นหาบทความในหมวดหมู่ ${category}...`}
          />
          
          {hasSearched && (
            <div className="mt-3 mb-5 bg-transparent px-4 py-2 rounded-lg flex justify-between items-center">
              <div>
                <span>ผลการค้นหา: </span>
                <span className="font-bold">{filteredPosts.length}</span> จาก <span className="font-bold">{posts.length}</span> บทความ
                {searchQuery && <span> สำหรับ &quot;<span className="font-semibold text-primary-color">{searchQuery}</span>&quot;</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ถ้ายังไม่ได้ค้นหาหรือเคลียร์การค้นหาแล้ว ให้แสดงทั้งหมด */}
      {!hasSearched ? (
        <BlogCard posts={posts} category={category} />
      ) : filteredPosts.length > 0 ? (
        <BlogCard posts={filteredPosts} category={category} />
      ) : (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">ไม่พบบทความ</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            ไม่พบบทความสำหรับคำค้นหา &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </div>
  );
}