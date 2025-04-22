// src/components/ui/Search/SearchInput.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Input, Button, Spinner } from "@heroui/react";
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  defaultValue?: string;
  onSearch?: (value: string) => void;
}

/**
 * รีเซ็ตค่า query บน URL โดยเอาเฉพาะที่เกี่ยวกับการค้นหาออก แต่ยังคงค่า query อื่นๆ ไว้
 * @param searchParams - ค่า query ที่มีอยู่ใน URL
 * @returns URLSearchParams ที่ไม่มีค่า query ที่เกี่ยวกับการค้นหา
 */
const getCleanSearchParams = (searchParams: URLSearchParams): URLSearchParams => {
  const newParams = new URLSearchParams(searchParams);
  newParams.delete('q');
  return newParams;
};

export default function SearchInput({
  placeholder = 'ค้นหา...',
  className = '',
  disabled = false,
  autoFocus = false,
  defaultValue = '',
  onSearch
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // ดึงค่า query จาก URL ถ้ามี
  const query = searchParams.get('q') || defaultValue;
  
  const [searchTerm, setSearchTerm] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  
  // ใช้ debounce เพื่อลดจำนวนการค้นหาเมื่อพิมพ์
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // อัพเดต URL เมื่อ debouncedSearchTerm เปลี่ยน
  useEffect(() => {
    if (debouncedSearchTerm !== query) {
      setIsSearching(true);
      
      // สร้าง URL ใหม่ที่มีค่า query
      const newParams = getCleanSearchParams(searchParams);
      if (debouncedSearchTerm) {
        newParams.set('q', debouncedSearchTerm);
      }
      
      const newPathname = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
      router.push(newPathname);
      
      // เรียกใช้ callback ถ้ามี
      if (onSearch) {
        onSearch(debouncedSearchTerm);
      }
      
      // ดีเลย์เล็กน้อยเพื่อให้เห็น spinner
      setTimeout(() => {
        setIsSearching(false);
      }, 300);
    } else {
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, pathname, router, searchParams, query, onSearch]);

  // ล้างการค้นหา
  const handleClear = () => {
    setSearchTerm('');
    
    // สร้าง URL ใหม่ที่ไม่มีค่า query
    const newParams = getCleanSearchParams(searchParams);
    const newPathname = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    router.push(newPathname);
    
    // เรียกใช้ callback ถ้ามี
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <Input
        placeholder={placeholder}
        variant="bordered"
        radius="full"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm transition-all"
        autoFocus={autoFocus}
        disabled={disabled}
        startContent={
          isSearching ? (
            <Spinner size="sm" className="text-primary-color" />
          ) : (
            <FaSearch className="text-primary-color h-4 w-4 flex-shrink-0" />
          )
        }
        endContent={
          searchTerm && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="p-0 h-4 w-4"
              onPress={handleClear}
            >
              <FaTimes className="h-3 w-3" />
            </Button>
          )
        }
      />
    </div>
  );
}