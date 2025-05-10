import React from "react";
import { Spinner } from "@heroui/react";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Loading({
  message = "กำลังโหลด...",
  fullScreen = false,
  size = "lg"
}: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-transparent gap-4 ${fullScreen ? "fixed inset-0" : "h-full w-full min-h-[200px]"
        }`}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner
          size={size}
          label={message}
          variant="wave"
          classNames={{
            label: "text-foreground mt-4 font-[family-name:var(--font-line-seed-sans)] text-sm"
          }}
        />
      </div>
    </div>
  );
}