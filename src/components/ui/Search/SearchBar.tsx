// src/components/ui/Search/SearchBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Input, Button } from "@heroui/react";
import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  contentType?: 'blog' | 'place';
  className?: string;
}

export default function SearchBar({
  placeholder,
  onSearch,
  contentType = 'blog',
  className = ""
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ค้นหาเมื่อกด Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // ส่งค่า searchTerm ไปค้นหาไม่ว่าจะมีค่าหรือไม่ก็ตาม
      onSearch(searchTerm);
    }
  };

  // ล้างการค้นหา
  const handleClear = () => {
    setSearchTerm("");
    // เรียกฟังก์ชัน onSearch ด้วยค่าว่างเพื่อรีเซ็ตการค้นหา
    onSearch("");
  };

  // เมื่อกดปุ่มค้นหา
  const handleSearch = () => {
    // ส่งค่า searchTerm ไปค้นหาไม่ว่าจะมีค่าหรือไม่ก็ตาม
    onSearch(searchTerm);
  };

  // เมื่อมีการเปลี่ยนแปลงค่า searchTerm
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // ไม่ต้องเรียก onSearch ทันทีเมื่อพิมพ์ เพราะอาจทำให้การค้นหาถี่เกินไป
  };

  if (!isMounted) {
    return null; // ป้องกัน hydration error
  }

  const searchPlaceholder = placeholder ||
    (contentType === 'blog' ? "ค้นหาบทความ..." : "ค้นหาสถานที่ท่องเที่ยว...");

  return (
    <div className={`flex flex-col sm:flex-row gap-2 w-full ${className}`}>
      <div className="relative flex-1">
        <Input
          isClearable
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={searchPlaceholder}
          variant="flat"
          size="md"
          radius="full"
          onKeyPress={handleKeyPress}
          onClear={handleClear}
          startContent={<FaSearch className="text-default-400" />}
          classNames={{
            input: "text-md",
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button
          isIconOnly
          color="primary"
          radius="full"
          onPress={handleSearch}
        >
          <FaSearch size={20} />
        </Button>
      </div>
    </div>
  );
}