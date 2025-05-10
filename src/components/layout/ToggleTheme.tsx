"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { BsFillMoonStarsFill, BsFillSunFill } from "react-icons/bs";
import { useTheme } from "next-themes";

interface ToggleThemeProps {
  size?: "md" | "sm" | "lg";
  iconSize?: number;
  className?: string;
}

export default function ToggleTheme({ size = "md", iconSize = 22, className = "" }: ToggleThemeProps) {
  const { setTheme } = useTheme();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    // Set initial theme from localStorage or default to light
    const storedTheme = localStorage.getItem("theme");
    const defaultTheme = storedTheme || "light";
    setTheme(defaultTheme);
    setIsDarkTheme(defaultTheme === "dark");
  }, [setTheme]);

  const handleThemeToggle = () => {
    const newTheme = isDarkTheme ? "light" : "dark";
    setIsDarkTheme(!isDarkTheme);
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <Button
      radius="full"
      color="default"
      size={size}
      isIconOnly
      className={`bg-transparent ${className}`}
      onPress={handleThemeToggle}
    >
      {isDarkTheme ? (
        <BsFillMoonStarsFill size={iconSize} className="text-zinc-400 dark:text-zinc-400" />
      ) : (
        <BsFillSunFill size={iconSize} className="text-zinc-400 dark:text-zinc-400" />
      )}
    </Button>
  );
}
