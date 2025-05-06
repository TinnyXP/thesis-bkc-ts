// src/components/ui/Sanity/Blog/BlogCardList.tsx
"use client";

import React, { useState, useCallback } from "react";
import { Loading, BlogCard, SearchBar } from "@/components";
import { usePosts } from "@/hooks/usePosts";
import { Button } from "@heroui/react";
import { Post } from "@/lib/sanity";

interface BlogCardListProps {
  category?: string;
  showSearchBar?: boolean; // เพิ่ม prop ใหม่
}

export default function BlogCardList({ category, showSearchBar = true }: BlogCardListProps) {
  const { posts, isLoading, isError } = usePosts(category);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // ฟังก์ชันค้นหา
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
    
    if (!query.trim()) {
      // ล้างการค้นหา กลับไปแสดงทั้งหมด
      setFilteredPosts([]);
      setHasSearched(false);
      return;
    }
    
    // กรองบทความตามชื่อหรือคำอธิบาย
    const lowerCaseQuery = query.toLowerCase();
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(lowerCaseQuery) || 
      (post.excerpt && post.excerpt.toLowerCase().includes(lowerCaseQuery))
    );
    
    setFilteredPosts(filtered);
  }, [posts]);

  // ในกรณีที่โหลดข้อมูลใหม่ แต่ไม่ได้มีการค้นหา
  React.useEffect(() => {
    if (posts && !hasSearched) {
      setFilteredPosts([]);
    } else if (posts && hasSearched && searchQuery) {
      // อัปเดตผลการค้นหาหากมีข้อมูลใหม่
      handleSearch(searchQuery);
    }
  }, [posts, hasSearched, searchQuery, handleSearch]);

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

  return (
    <div>
      {showSearchBar && ( // เพิ่มเงื่อนไขการแสดง SearchBar
        <div className="mb-6">
          <SearchBar 
            onSearch={handleSearch}
            contentType="blog"
          />
          
          {hasSearched && searchQuery && (
            <div className="mt-3 mb-5 bg-zinc-100/70 dark:bg-zinc-800/70 px-4 py-2 rounded-lg flex justify-between items-center">
              <div>
                <span>ผลการค้นหา: </span>
                <span className="font-bold">{filteredPosts.length}</span> จาก <span className="font-bold">{posts.length}</span> บทความ
                {searchQuery && <span> สำหรับ &quot;<span className="font-semibold text-primary-color">{searchQuery}</span>&quot;</span>}
              </div>
              
              {filteredPosts.length === 0 && (
                <div className="text-zinc-500">ไม่พบผลลัพธ์</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ถ้ายังไม่ได้ค้นหาหรือเคลียร์การค้นหาแล้ว ให้แสดงทั้งหมด */}
      {!hasSearched ? (
        <BlogCard posts={posts} />
      ) : filteredPosts.length > 0 ? (
        <BlogCard posts={filteredPosts} />
      ) : (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-4">ไม่พบบทความ</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            ไม่พบบทความสำหรับคำค้นหา &quot;{searchQuery}&quot;
          </p>
          <Button color="primary" onPress={() => handleSearch("")}>
            แสดงบทความทั้งหมด
          </Button>
        </div>
      )}
    </div>
  );
}