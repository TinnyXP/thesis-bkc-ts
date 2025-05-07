"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { useSession } from "next-auth/react";
import { IoClose } from "react-icons/io5";

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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 w-full px-2 pb-2 sm:flex sm:justify-center sm:px-4 lg:px-8 z-50">
      <div className="pointer-events-auto flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-large sm:rounded-full border-1 border-divider bg-gradient-to-r from-white/80 via-primary-50/80 to-white/80 dark:from-zinc-900/80 dark:via-zinc-800/80 dark:to-zinc-900/80 px-3 py-3 shadow-lg backdrop-blur-xl w-full sm:max-w-lg">
        <div className="flex flex-col items-center sm:ml-3 sm:items-start">
          <div className="flex gap-2">
            <p className="text-sm text-foreground font-semibold line-clamp-1">
              สวัสดี, คุณ {session.user.name}!
            </p>
            <p className="text-sm text-foreground">
              ยินดีต้อนรับสู่บางกะเจ้า
            </p>
          </div>
          <p className="text-xs text-default-500 mt-1">
            ID ของคุณ: {session.user.bkcId}
          </p>
        </div>

        {/* ปุ่มปิดสำหรับมือถือ - แสดงเต็มแนว */}
        <Button
          className="group relative overflow-hidden bg-transparent text-small font-normal mt-2 block sm:hidden"
          color="default"
          aria-label="ปิด Banner"
          onPress={() => setIsVisible(false)}
          style={{
            border: "solid 2px transparent",
            backgroundImage: `linear-gradient(hsl(var(--heroui-background)), hsl(var(--heroui-background))), linear-gradient(to right, #10CE50, #06C755)`,
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
          }}
          variant="bordered"
          size="sm"
        >
          <div className="flex gap-1 items-center justify-center">
            <IoClose size={20} />
            <span>ปิดหน้าต่าง</span>
          </div>
        </Button>

        {/* ปุ่มปิดสำหรับหน้าจอใหญ่ - แสดงเป็นสี่เหลี่ยมจัตุรัส */}
        <Button
          className="group relative overflow-hidden bg-transparent hidden sm:flex mt-0 h-10 w-10"
          color="default"
          aria-label="ปิด Banner"
          onPress={() => setIsVisible(false)}
          style={{
            border: "solid 2px transparent",
            backgroundImage: `linear-gradient(hsl(var(--heroui-background)), hsl(var(--heroui-background))), linear-gradient(to right, #10CE50, #06C755)`,
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
          }}
          variant="bordered"
          radius="full"
          size="sm"
          isIconOnly
        >
          <IoClose size={24} />
        </Button>
      </div>
    </div>
  );
}