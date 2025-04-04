'use client';

import React from 'react';
import { Tabs, Tab } from "@heroui/react";
import { useLanguage } from '../hooks/useLanguage';
import { Key } from 'react';

/**
 * คอมโพเนนต์เลือกภาษาแบบแท็บ
 */
export default function LanguageSelectorTab() {
  // ไม่ได้ใช้ t แต่อาจจะใช้ในอนาคต ใส่ underscore เพื่อแสดงว่าไม่ได้ใช้
  // const { t: _t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  // รับคีย์ที่เลือกในปัจจุบันตามรหัสภาษา
  const getCurrentKey = () => {
    switch (currentLanguage.code) {
      case "th": return "thai";
      case "en": return "english";
      case "zh": return "chinese";
      default: return "thai";
    }
  };

  // จัดการการเปลี่ยนแปลงการเลือกแท็บ
  const handleTabChange = (key: Key) => {
    switch (key) {
      case "thai":
        changeLanguage("th");
        break;
      case "english":
        changeLanguage("en");
        break;
      case "chinese":
        changeLanguage("zh");
        break;
    }
  };

  return (
    <Tabs 
      aria-label="Language Tabs" 
      color="primary" 
      variant="underlined"
      placement="start"
      selectedKey={getCurrentKey()}
      classNames={{
        tabContent: "font-[family-name:var(--font-line-seed-sans)] text-md group-data-[selected=true]:primary-color",
      }}
      onSelectionChange={handleTabChange}
    >
      <Tab key="thai" title="ไทย" />
      <Tab key="english" title="English" />
      <Tab key="chinese" title="中文" />
    </Tabs>
  );
}