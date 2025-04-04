'use client';

import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../config';

/**
 * Custom hook to manage language preference
 * 
 * Provides:
 * - Current language info
 * - List of available languages
 * - Function to change language
 * - Automatic loading of saved language preference
 */
export function useLanguage() {
  const { i18n: i18nInstance } = useTranslation();
  
  // Get the current language from i18n
  const currentLang = i18nInstance.language || 'th';
  
  // Get current language info
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];
  
  // Change language and store preference in localStorage
  const changeLanguage = useCallback((languageCode: string) => {
    // Validate that the language code exists in our supported languages
    if (languages.some(lang => lang.code === languageCode)) {
      // Change language using i18n
      i18nInstance.changeLanguage(languageCode);
      
      // Store selected language in localStorage for persistence
      try {
        localStorage.setItem('userLanguage', languageCode);
      } catch (e) {
        console.error('Failed to save language preference:', e);
      }
    } else {
      console.warn(`Language code "${languageCode}" is not supported`);
    }
  }, [i18nInstance]);
  
  // Load saved language preference on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('userLanguage');
      if (savedLanguage && languages.some(lang => lang.code === savedLanguage)) {
        i18nInstance.changeLanguage(savedLanguage);
      }
    } catch (e) {
      console.error('Failed to load language preference:', e);
    }
  }, [i18nInstance]);
  
  return {
    currentLanguage,
    languages,
    changeLanguage
  };
}