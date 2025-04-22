// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook สำหรับทำ debounce โดยรับค่า value และ delay time
 * @param value - ค่าที่ต้องการทำ debounce
 * @param delay - ระยะเวลาในการ debounce (มิลลิวินาที)
 * @returns ค่าที่ผ่านการ debounce แล้ว
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // ตั้ง timeout เพื่อรอให้ครบตามเวลาที่กำหนดก่อนอัพเดทค่า
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // ยกเลิก timeout เมื่อค่าเปลี่ยนเพื่อเริ่มนับใหม่
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}