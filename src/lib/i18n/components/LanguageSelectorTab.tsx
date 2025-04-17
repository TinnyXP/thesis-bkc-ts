'use client';

import React from 'react';
import { Tabs, Tab } from "@heroui/react";
import { useLanguage } from '../hooks/useLanguage';
import { Key } from 'react';

/**
 * คอมโพเนนต์เลือกภาษาแบบแท็บ
 * @param {Object} props - คุณสมบัติของคอมโพเนนต์
 * @param {string} props.placement - ตำแหน่งการวางแท็บ ("top" หรือ "start")
 * @param {boolean} props.fullWidth - กำหนดให้แท็บขยายเต็มความกว้างที่มี
 * @param {string} props.variant - รูปแบบของแท็บ (underlined, bordered, light, solid)
 */
export default function LanguageSelectorTab({ 
  placement = "start",
  fullWidth = false,
  variant = "underlined"
}: { 
  placement?: "top" | "start",
  fullWidth?: boolean,
  variant?: "underlined" | "bordered" | "light" | "solid"
}) {
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

  // กำหนด classNames สำหรับ Tabs component
  const tabsClassNames = {
    base: fullWidth ? "w-full" : "",
    tabList: fullWidth ? "w-full flex" : "",
    tab: fullWidth ? "flex-1 flex justify-center" : "",
    tabContent: "font-[family-name:var(--font-line-seed-sans)] text-md group-data-[selected=true]:primary-color",
  };

  return (
    <Tabs
      aria-label="Language Tabs"
      color="primary"
      variant={variant}
      placement={placement}
      selectedKey={getCurrentKey()}
      classNames={tabsClassNames}
      onSelectionChange={handleTabChange}
    >
      <Tab key="thai" title="ไทย" />
      <Tab key="english" title="English" />
      <Tab key="chinese" title="中文" />
    </Tabs>
  );
}