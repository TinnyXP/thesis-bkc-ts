// src/components/ui/Search/SearchFilter.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem, 
  Button, 
  Chip,
  VisuallyHidden
} from "@heroui/react";
import { FaFilter, FaTimes } from 'react-icons/fa';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface FilterOption {
  key: string;
  label: string;
  options: {
    value: string;
    label: string;
  }[];
}

interface SearchFilterProps {
  filters: FilterOption[];
  className?: string;
}

export default function SearchFilter({ filters, className = '' }: SearchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // ดึงค่า filter จาก URL
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  // อัพเดตค่า activeFilters เมื่อ URL เปลี่ยน
  useEffect(() => {
    const newActiveFilters: Record<string, string> = {};
    
    // วนลูปทุก filter key เพื่อดึงค่าจาก URL
    filters.forEach(filter => {
      const value = searchParams.get(filter.key);
      if (value) {
        newActiveFilters[filter.key] = value;
      }
    });
    
    setActiveFilters(newActiveFilters);
  }, [searchParams, filters]);
  
  // อัพเดต URL เมื่อเลือก filter
  const handleFilterChange = (filterKey: string, value: string | null) => {
    // สร้าง URLSearchParams ใหม่จากค่าเดิม
    const params = new URLSearchParams(searchParams);
    
    if (value === null) {
      // ถ้าค่าเป็น null ให้ลบ key นั้นออกจาก URL
      params.delete(filterKey);
    } else {
      // ถ้ามีค่า ให้เซ็ตค่าใน URL
      params.set(filterKey, value);
    }
    
    // ไปยัง URL ใหม่ที่มีค่า filter
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // ล้าง filter ทั้งหมด
  const clearAllFilters = () => {
    // สร้าง URLSearchParams ใหม่จากค่าเดิม แต่เอาเฉพาะค่า q
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) {
      params.set('q', q);
    }
    
    // ไปยัง URL ใหม่ที่ไม่มีค่า filter
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // นับจำนวน filter ที่เลือก
  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Dropdown>
        <DropdownTrigger>
          <Button 
            variant="bordered"
            radius="full"
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-default-200 transition-all"
            startContent={<FaFilter className="h-3.5 w-3.5" />}
            endContent={
              activeFilterCount > 0 && (
                <Chip size="sm" variant="flat" color="primary">
                  {activeFilterCount}
                </Chip>
              )
            }
          >
            ตัวกรอง
          </Button>
        </DropdownTrigger>
        <DropdownMenu 
          aria-label="ตัวกรองการค้นหา"
          className="min-w-[240px]"
        >
          {filters.map((filter) => (
            <DropdownItem 
              key={filter.key} 
              className="p-0 focus:outline-none" 
              textValue={filter.label}
            >
              <div className="px-2 py-1">
                <VisuallyHidden id={`filter-${filter.key}-label`}>
                  {filter.label}
                </VisuallyHidden>
                <p className="text-small font-semibold text-default-500 mb-1.5">{filter.label}</p>
                <div className="flex flex-wrap gap-1">
                  {/* ตัวเลือก "ทั้งหมด" */}
                  <Chip 
                    size="sm"
                    variant={!activeFilters[filter.key] ? "solid" : "bordered"}
                    color={!activeFilters[filter.key] ? "primary" : "default"}
                    className="cursor-pointer transition-all"
                    onClick={() => handleFilterChange(filter.key, null)}
                  >
                    ทั้งหมด
                  </Chip>
                  
                  {filter.options.map((option) => (
                    <Chip 
                      key={option.value}
                      size="sm"
                      variant={activeFilters[filter.key] === option.value ? "solid" : "bordered"}
                      color={activeFilters[filter.key] === option.value ? "primary" : "default"}
                      className="cursor-pointer transition-all"
                      onClick={() => handleFilterChange(filter.key, option.value)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </DropdownItem>
          ))}
          
          {activeFilterCount > 0 && (
            <>
              <DropdownItem key="divider" className="h-px bg-default-200 my-1.5" aria-hidden="true" />
              <DropdownItem 
                key="clear" 
                className="text-danger"
                textValue="ล้างตัวกรองทั้งหมด"
                onClick={clearAllFilters}
                startContent={<FaTimes className="h-3.5 w-3.5" />}
              >
                ล้างตัวกรองทั้งหมด
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </Dropdown>
      
      {/* แสดง Chip ของตัวกรองที่เลือก */}
      {Object.entries(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          {Object.entries(activeFilters).map(([key, value]) => {
            // หาชื่อ filter และค่าที่เลือก
            const filter = filters.find(f => f.key === key);
            const option = filter?.options.find(o => o.value === value);
            
            if (!filter || !option) return null;
            
            return (
              <Chip 
                key={`${key}-${value}`}
                size="sm"
                variant="solid"
                color="primary"
                className="transition-all"
                onClose={() => handleFilterChange(key, null)}
              >
                {filter.label}: {option.label}
              </Chip>
            );
          })}
        </div>
      )}
    </div>
  );
}