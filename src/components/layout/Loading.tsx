import React from "react";
import { Spinner } from "@heroui/react";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Loading({
  message = "Loading...",
  fullScreen = false,
  size = "md"
}: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 bg-gradient-to-r from-content1/50 via-primary-100 to-content1/50 animate-breathing-gradient ${fullScreen ? "fixed inset-0" : "h-full w-full min-h-[200px]"
        }`}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner
          size={size}
          label={message}
          variant="gradient"
          classNames={{
            label: "text-foreground mt-4 font-[family-name:var(--font-line-seed-sans)] text-sm"
          }}
        />
      </div>
    </div>
  );
}