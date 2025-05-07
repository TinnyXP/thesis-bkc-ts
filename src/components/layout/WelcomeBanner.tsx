// src/components/layout/WelcomeBanner.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button, Link } from "@heroui/react";
import { useSession } from "next-auth/react";

export default function WelcomeBanner() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !session || !isVisible) {
    return null;
  }

  return (
    <div className="flex w-full items-center gap-x-3 border-b-1 border-divider bg-background/[0.15] px-6 py-2 backdrop-blur-xl sm:px-3.5 sm:before:flex-1">
      <p className="text-small text-foreground">
        <span className="font-semibold">สวัสดี, คุณ {session.user.name}!</span> ยินดีต้อนรับสู่บางกะเจ้า
        <span className="text-xs text-default-500 ml-2">ID ของคุณ: {session.user.bkcId}</span>
      </p>
      <Button
        as={Link}
        className="group relative h-9 overflow-hidden bg-transparent text-small font-normal"
        color="default"
        endContent={
          <svg
            className="flex-none outline-none transition-transform group-data-[hover=true]:translate-x-0.5 [&>path]:stroke-[2]"
            width="16" 
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 12h14m0 0l-7-7m7 7l-7 7"
            />
          </svg>
        }
        href="/history"
        style={{
          border: "solid 2px transparent",
          backgroundImage: `linear-gradient(hsl(var(--heroui-background)), hsl(var(--heroui-background))), linear-gradient(to right, #10CE50, #06C755)`,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
        variant="bordered"
      >
        เข้าชม
      </Button>
      <div className="flex flex-1 justify-end">
        <Button 
          isIconOnly 
          className="-m-1" 
          size="sm" 
          variant="light"
          onPress={() => setIsVisible(false)}
        >
          <span className="sr-only">ปิด Banner</span>
          <svg 
            className="text-default-500" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M18 6L6 18M6 6l12 12"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}