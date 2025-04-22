// src/data/placeFilters.ts
import { FilterOption } from '@/components/ui/Sanity/Search/SearchFilter';

// กำหนดตัวกรองสำหรับหน้าสถานที่ท่องเที่ยว
export const placeFilters: FilterOption[] = [
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
  {
    key: 'facilities',
    label: 'สิ่งอำนวยความสะดวก',
    options: [
      { value: 'parking', label: 'ที่จอดรถ' },
      { value: 'restroom', label: 'ห้องน้ำ' },
      { value: 'restaurant', label: 'ร้านอาหาร' },
      { value: 'wifi', label: 'WiFi' },
      { value: 'photospots', label: 'จุดถ่ายรูป' },
      { value: 'souvenirshop', label: 'ร้านของที่ระลึก' }
    ]
  }
];

// กำหนดตัวกรองสำหรับหน้าประเภทสถานที่
export const getTypeFilters = (typeSlug: string): FilterOption[] => {
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
    },
    {
      key: 'district',
      label: 'ตำบล',
      options: [
        { value: 'bangkachao', label: 'บางกะเจ้า' },
        { value: 'bangkasop', label: 'บางกระสอบ' },
        { value: 'bangnamphueng', label: 'บางน้ำผึ้ง' },
        { value: 'bangkobua', label: 'บางกอบัว' },
        { value: 'songkanong', label: 'ทรงคนอง' },
        { value: 'bangyo', label: 'บางยอ' }
      ]
    }
  ];
};

// กำหนดตัวกรองสำหรับหน้าตำบล
export const getDistrictFilters = (districtSlug: string): FilterOption[] => {
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
    },
    {
      key: 'type',
      label: 'ประเภท',
      options: [
        { value: 'temple', label: 'วัด/ศาสนสถาน' },
        { value: 'park', label: 'สวนสาธารณะ' },
        { value: 'market', label: 'ตลาด' },
        { value: 'museum', label: 'พิพิธภัณฑ์' },
        { value: 'restaurant', label: 'ร้านอาหาร' },
        { value: 'cafe', label: 'คาเฟ่' },
        { value: 'nature', label: 'แหล่งธรรมชาติ' },
        { value: 'activity', label: 'กิจกรรม' }
      ]
    }
  ];
};