// src/components/ui/Search/SearchBar.tsx
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components';
import { SearchFilter, FilterOption } from '@/components/ui/Sanity/Search/SearchFilter';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  filters?: FilterOption[];
  onSearch?: (value: string) => void;
}

/**
 * คอมโพเนนต์ SearchBar ที่รวม SearchInput และ SearchFilter เข้าด้วยกัน
 */
export default function SearchBar({
  placeholder = 'ค้นหา...',
  className = '',
  showFilters = false,
  filters = [],
  onSearch
}: SearchBarProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  return (
    <div className={`w-full flex flex-col sm:flex-row gap-2 items-start sm:items-center ${className}`}>
      <div className="w-full sm:flex-1">
        <SearchInput
          placeholder={placeholder}
          defaultValue={query}
          onSearch={onSearch}
          className="w-full"
        />
      </div>
      
      {showFilters && filters.length > 0 && (
        <div className="w-full sm:w-auto">
          <SearchFilter filters={filters} />
        </div>
      )}
    </div>
  );
}