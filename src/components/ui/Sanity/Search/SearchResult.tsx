// src/components/ui/Search/SearchResult.tsx
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { FaTimes } from 'react-icons/fa';
import { useRouter, usePathname } from 'next/navigation';

interface SearchResultProps {
  totalResults: number;
  totalItems: number;
  children?: React.ReactNode;
}

export default function SearchResult({
  totalResults,
  totalItems,
  children
}: SearchResultProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const query = searchParams.get('q');
  const hasFilters = Array.from(searchParams.keys()).some(key => 
    key !== 'q' && searchParams.get(key) !== null && searchParams.get(key) !== ''
  );
  
  // ไม่มีการค้นหาหรือตัวกรอง
  if (!query && !hasFilters) {
    return <>{children}</>;
  }
  
  // ล้างการค้นหาและตัวกรอง
  const clearSearch = () => {
    router.push(pathname);
  };
  
  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg mb-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold mb-1">ผลการค้นหา</h3>
            {query && (
              <p className="text-zinc-600 dark:text-zinc-400">
                พบ <span className="font-semibold">{totalResults}</span> รายการ
                จาก <span className="font-semibold">{totalItems}</span> รายการ
                สำหรับ <span className="font-semibold">"{query}"</span>
              </p>
            )}
            {!query && hasFilters && (
              <p className="text-zinc-600 dark:text-zinc-400">
                พบ <span className="font-semibold">{totalResults}</span> รายการที่ตรงกับเงื่อนไข
              </p>
            )}
          </div>
          <Button
            variant="light"
            color="danger"
            size="sm"
            startContent={<FaTimes />}
            onPress={clearSearch}
          >
            ล้างการค้นหา
          </Button>
        </div>
      </motion.div>
      
      {totalResults === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center py-16"
        >
          <h3 className="text-2xl font-semibold mb-2">ไม่พบผลการค้นหา</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            ลองค้นหาด้วยคำสำคัญอื่น หรือเปลี่ยนตัวกรอง
          </p>
          <Button
            color="primary"
            onPress={clearSearch}
          >
            ดูรายการทั้งหมด
          </Button>
        </motion.div>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}