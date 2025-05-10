// ปรับปรุงไฟล์ src/lib/i18n/config.ts

'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import th from '@/lib/i18n/translation/th';
import en from '@/lib/i18n/translation/en';
import zh from '@/lib/i18n/translation/zh';

// Export language config for reuse
export const languages = [
  { code: 'th', name: 'ไทย', hreflang: 'th-TH' },  // Thai
  { code: 'en', name: 'English', hreflang: 'en-US' },  // English
  { code: 'zh', name: '中文', hreflang: 'zh-CN' }  // Chinese
];

// เพิ่มฟังก์ชันสำหรับโหลดภาษาจาก localStorage
const getSavedLanguage = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const savedLang = localStorage.getItem('userLanguage');
      // ตรวจสอบว่าภาษาที่บันทึกอยู่ในรายการภาษาที่รองรับหรือไม่
      if (savedLang && languages.some(lang => lang.code === savedLang)) {
        return savedLang;
      }
    } catch (e) {
      console.error('Failed to get language from localStorage:', e);
    }
  }
  return 'th'; // ค่าเริ่มต้น
};

/**
 * Initialize i18next
 * - Sets default language to Thai
 * - Configures supported languages
 * - Loads translation resources
 */
i18n
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'th', // Thai as fallback language
    lng: getSavedLanguage(),  // เปลี่ยนจาก 'th' เป็นการเรียกใช้ฟังก์ชัน getSavedLanguage
    supportedLngs: ['th', 'en', 'zh'],
    
    interpolation: {
      escapeValue: false, // Not needed for React as it escapes by default
    },
    
    // Translation resources for all languages
    resources: {
      th: { translation: th },
      en: { translation: en },
      zh: { translation: zh }
    }
  });

/**
 * Helper function to change the application language
 * @param lng - Language code to change to
 * @returns Promise from i18n.changeLanguage
 */
export const changeLanguage = (lng: string) => {
  // บันทึกภาษาที่เลือกลงใน localStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userLanguage', lng);
    }
  } catch (e) {
    console.error('Failed to save language to localStorage:', e);
  }
  
  return i18n.changeLanguage(lng);
};

// Export the i18n instance
export default i18n;