// src/hooks/useSearchContext.ts
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Post, Place } from '@/lib/sanity';

/**
 * ฟังก์ชันสำหรับกรองข้อมูลตามคำค้นหา
 * @param items - รายการข้อมูลที่ต้องการกรอง (Post หรือ Place)
 * @param query - คำค้นหา
 * @returns รายการข้อมูลที่ผ่านการกรอง
 */
export function useSearchContext<T extends Post | Place>(items: T[]): {
  filteredItems: T[];
  query: string | null;
  totalItems: number;
  hasFilter: boolean;
} {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  /**
   * ฟังก์ชันสำหรับตรวจสอบว่าข้อมูลตรงกับเงื่อนไขการค้นหาหรือไม่
   */
  const isItemMatchingSearch = useCallback((item: T, searchTerm: string): boolean => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    // ตรวจสอบชื่อ/หัวข้อ
    if (item.title && item.title.toLowerCase().includes(lowerCaseSearchTerm)) {
      return true;
    }
    
    // ตรวจสอบคำอธิบาย/สรุป
    if ('description' in item && item.description && 
        typeof item.description === 'string' && 
        item.description.toLowerCase().includes(lowerCaseSearchTerm)) {
      return true;
    }
    
    if ('excerpt' in item && item.excerpt && 
        typeof item.excerpt === 'string' && 
        item.excerpt.toLowerCase().includes(lowerCaseSearchTerm)) {
      return true;
    }
    
    // ตรวจสอบหมวดหมู่
    if ('categories' in item && item.categories && Array.isArray(item.categories)) {
      for (const category of item.categories) {
        if (category.title && category.title.toLowerCase().includes(lowerCaseSearchTerm)) {
          return true;
        }
      }
    }
    
    // ตรวจสอบประเภทสถานที่
    if ('placeType' in item && item.placeType && 
        item.placeType.title && 
        item.placeType.title.toLowerCase().includes(lowerCaseSearchTerm)) {
      return true;
    }
    
    // ตรวจสอบตำบล
    if ('district' in item && item.district && 
        item.district.title && 
        item.district.title.toLowerCase().includes(lowerCaseSearchTerm)) {
      return true;
    }
    
    // ตรวจสอบแท็ก
    if ('tags' in item && item.tags && Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        if (typeof tag === 'string' && tag.toLowerCase().includes(lowerCaseSearchTerm)) {
          return true;
        }
      }
    }
    
    return false;
  }, []);
  
  /**
   * กรองรายการตามคำค้นหาและตัวกรอง
   */
  const filteredItems = useMemo(() => {
    let results = [...items];
    
    // กรองตามคำค้นหา
    if (query) {
      results = results.filter(item => isItemMatchingSearch(item, query));
    }
    
    // กรองตามหมวดหมู่ (category) สำหรับบทความ
    const category = searchParams.get('category');
    if (category && results.length > 0 && 'categories' in results[0]) {
      results = results.filter(item => {
        if (!('categories' in item) || !item.categories) return false;
        return item.categories.some(cat => cat.slug === category);
      });
    }
    
    // กรองตามประเภทสถานที่ (type) สำหรับสถานที่ท่องเที่ยว
    const type = searchParams.get('type');
    if (type && results.length > 0 && 'placeType' in results[0]) {
      results = results.filter(item => {
        if (!('placeType' in item) || !item.placeType) return false;
        return item.placeType.slug.current === type;
      });
    }
    
    // กรองตามตำบล (district) สำหรับสถานที่ท่องเที่ยว
    const district = searchParams.get('district');
    if (district && results.length > 0 && 'district' in results[0]) {
      results = results.filter(item => {
        if (!('district' in item) || !item.district) return false;
        return item.district.slug.current === district;
      });
    }
    
    return results;
  }, [items, query, searchParams, isItemMatchingSearch]);

  // ตรวจสอบว่ามีการใช้ filter หรือไม่
  const hasFilter = useMemo(() => {
    return (
      Boolean(query) || 
      Boolean(searchParams.get('category')) || 
      Boolean(searchParams.get('type')) || 
      Boolean(searchParams.get('district'))
    );
  }, [query, searchParams]);

  return {
    filteredItems,
    query,
    totalItems: items.length,
    hasFilter
  };
}