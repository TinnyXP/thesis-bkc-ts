"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { COMPONENT_SIZES } from "@/constants/ui";

interface ToggleThemeProps {
  size?: typeof COMPONENT_SIZES.SM | typeof COMPONENT_SIZES.MD | typeof COMPONENT_SIZES.LG;
  iconSize?: number;
  className?: string;
}

/**
 * คอมโพเนนต์สำหรับสลับธีมระหว่างโหมดมืดและโหมดสว่าง
 */
export default function ToggleTheme({ 
  size = COMPONENT_SIZES.MD, 
  iconSize = 22, 
  className = "" 
}: ToggleThemeProps) {
  const { setTheme, theme } = useTheme();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // ตั้งค่าสถานะเริ่มต้นเมื่อคอมโพเนนต์ถูกโหลด
    setMounted(true);
  }, []);

  useEffect(() => {
    // อัพเดทสถานะของธีมเมื่อ theme เปลี่ยนแปลง
    if (mounted) {
      setIsDarkTheme(theme === "dark");
    }
  }, [theme, mounted]);

  // ฟังก์ชันสำหรับสลับธีม
  const handleThemeToggle = () => {
    const newTheme = isDarkTheme ? "light" : "dark";
    setIsDarkTheme(!isDarkTheme);
    setTheme(newTheme);
    
    // บันทึกธีมลงใน localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("theme", newTheme);
    }
  };

  // แสดง placeholder ก่อนที่ component จะ hydrate เพื่อป้องกัน UI กระพริบ
  if (!mounted) {
    return (
      <Button
        radius="full"
        color="default"
        size={size}
        isIconOnly
        className={`bg-transparent ${className}`}
        disabled
      >
        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </Button>
    );
  }

  return (
    <Button
      radius="full"
      color="default"
      size={size}
      isIconOnly
      className={`bg-transparent ${className}`}
      onPress={handleThemeToggle}
      aria-label={isDarkTheme ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
    >
      {isDarkTheme ? (
        <Moon size={iconSize} className="text-zinc-400 dark:text-zinc-400" />
      ) : (
        <Sun size={iconSize} className="text-zinc-400 dark:text-zinc-400" />
      )}
    </Button>
  );
}