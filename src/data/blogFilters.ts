// src/data/blogFilters.ts
import { FilterOption } from '@/components/ui/Sanity/Search/SearchFilter';

// กำหนดตัวกรองสำหรับหน้าบทความ
export const blogFilters: FilterOption[] = [
  {
    key: 'sort',
    label: 'เรียงตาม',
    options: [
      { value: 'latest', label: 'ล่าสุด' },
      { value: 'oldest', label: 'เก่าสุด' },
      { value: 'a-z', label: 'ชื่อ A-Z' },
      { value: 'z-a', label: 'ชื่อ Z-A' }
    ]
  },
];

// กำหนดตัวกรองสำหรับหน้าหมวดหมู่บทความ
export const getCategoryFilters = (categorySlug: string): FilterOption[] => {
  return [
    {
      key: 'sort',
      label: 'เรียงตาม',
      options: [
        { value: 'latest', label: 'ล่าสุด' },
        { value: 'oldest', label: 'เก่าสุด' },
        { value: 'a-z', label: 'ชื่อ A-Z' },
        { value: 'z-a', label: 'ชื่อ Z-A' }
      ]
    }
  ];
};