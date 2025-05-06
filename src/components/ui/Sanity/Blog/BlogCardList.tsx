"use client";

import React, { useState, useCallback } from "react";
import { Loading, BlogCard, SearchBar } from "@/components";
import { usePosts } from "@/hooks/usePosts";
import { Button } from "@heroui/react";
import { Post } from "@/lib/sanity/schema";

interface BlogCardListProps {
  category?: string;
  showSearchBar?: boolean;
}

export default function BlogCardList({ category, showSearchBar = true }: BlogCardListProps) {
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

  // ล้างการค้นหา
  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredPosts([]);
    setHasSearched(false);
  };

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
      {showSearchBar && (
        <div className="mb-6">
          <SearchBar 
            onSearch={handleSearch}
            contentType="blog"
          />
          
          {hasSearched && (
            <div className="mt-3 mb-5 bg-zinc-100/70 dark:bg-zinc-800/70 px-4 py-2 rounded-lg flex justify-between items-center">
              <div>
                <span>ผลการค้นหา: </span>
                <span className="font-bold">{filteredPosts.length}</span> จาก <span className="font-bold">{posts.length}</span> บทความ
                {searchQuery && <span> สำหรับ &quot;<span className="font-semibold text-primary-color">{searchQuery}</span>&quot;</span>}
              </div>
              
              {searchQuery && (
                <Button 
                  variant="light" 
                  size="sm" 
                  onPress={handleClearSearch}
                >
                  ล้างการค้นหา
                </Button>
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
          <Button color="primary" onPress={handleClearSearch}>
            แสดงบทความทั้งหมด
          </Button>
        </div>
      )}
    </div>
  );
}