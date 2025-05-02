'use client';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { languages } from '../config';

export function useLanguage() {
  const { i18n: i18nInstance } = useTranslation();

  const currentLang = i18nInstance.language || 'th';
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  const changeLanguage = useCallback((languageCode: string) => {
    if (languages.some(lang => lang.code === languageCode)) {
      i18nInstance.changeLanguage(languageCode);
      Cookies.set('NEXT_LOCALE', languageCode, { expires: 365 }); // ✅ ใช้ cookie แทน
    } else {
      console.warn(`Language code "${languageCode}" is not supported`);
    }
  }, [i18nInstance]);

  useEffect(() => {
    const savedLanguage = Cookies.get('NEXT_LOCALE');
    if (savedLanguage && languages.some(lang => lang.code === savedLanguage)) {
      i18nInstance.changeLanguage(savedLanguage);
    }
  }, [i18nInstance]);

  return {
    currentLanguage,
    languages,
    changeLanguage
  };
}
