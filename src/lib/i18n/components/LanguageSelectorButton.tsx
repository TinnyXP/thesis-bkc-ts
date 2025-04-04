'use client';

import React, { useState, useEffect } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Button } from "@heroui/react";
import { useLanguage } from '../hooks/useLanguage';
import { Key } from 'react';

/**
 * คอมโพเนนต์ปุ่มเลือกภาษาแบบดรอปดาวน์
 */
export default function LanguageSelectorButton() {
  // ไม่ได้ใช้ t แต่เก็บไว้เผื่อใช้ในอนาคต ใส่ underscore เพื่อแสดงว่าไม่ได้ใช้
  // const { t: _t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState("TH");

  // ตัวเลือกภาษา
  const languageOptions = [
    { key: "th", display: "TH", name: "ไทย" },
    { key: "en", display: "EN", name: "English" },
    { key: "zh", display: "CN", name: "中文" },
  ];

  // ตั้งค่าการแสดงผลภาษาเริ่มต้นตามภาษาปัจจุบัน
  useEffect(() => {
    const langOption = languageOptions.find(lang => lang.key === currentLanguage.code);
    if (langOption) {
      setSelectedLanguage(langOption.display);
    }
  }, [currentLanguage.code, languageOptions]);

  // จัดการการเปลี่ยนภาษา
  const handleLanguageChange = (key: Key) => {
    const langKey = key.toString();
    changeLanguage(langKey);
    const langOption = languageOptions.find(lang => lang.key === langKey);
    if (langOption) {
      setSelectedLanguage(langOption.display);
    }
  };

  return (
    <Dropdown
      classNames={{
        content: "min-w-[90px] p-1 font-[family-name:var(--font-line-seed-sans)]",
      }}
    >
      <DropdownTrigger>
        <Button
          radius="full"
          size="md"
          isIconOnly
          className="bg-transparent border-1.5 border-default-200 dark:border-default-200 text-zinc-400 dark:text-zinc-400 font-bold"
        >
          {selectedLanguage}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="เลือกภาษา"
        color="primary"
        onAction={handleLanguageChange}
        classNames={{
          base: "w-[80px]",
        }}
        itemClasses={{
          base: "text-center"
        }}
      >
        {languageOptions.map((lang) => (
          <DropdownItem key={lang.key}>{lang.name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}