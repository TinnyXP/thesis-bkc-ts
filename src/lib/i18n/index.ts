/**
 * Main export file for i18n module
 * Centralizes all exports to simplify imports in other files
 */

// Export core i18n setup
export { default as i18n, changeLanguage, languages } from '@/lib/i18n/config';

// Export hooks
export { useLanguage } from '@/lib/i18n/hooks/useLanguage';

// Export components
export { default as TranslationProvider } from '@/lib/i18n/components/TranslationProvider';
export { default as LanguageSelectorButton } from '@/lib/i18n/components/LanguageSelectorButton';
export { default as LanguageSelectorTab } from '@/lib/i18n/components/LanguageSelectorTab';

// Export translations (in case needed directly)
export { default as translationsEN } from '@/lib/i18n/translation/en';
export { default as translationsTH } from '@/lib/i18n/translation/th';
export { default as translationsZH } from '@/lib/i18n/translation/zh';