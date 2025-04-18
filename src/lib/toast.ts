// src/lib/toast.ts
import { addToast } from "@heroui/react";

type ToastType = "success" | "error" | "warning" | "info";

// แก้ไขประเภทของ placement ให้ตรงกับ API
type ToastPlacement = "bottom-right" | "bottom-left" | "bottom-center" | "top-right" | "top-left" | "top-center";

interface ToastOptions {
  duration?: number;
  placement?: ToastPlacement;
}

/**
 * แสดง Toast สำหรับการแจ้งเตือนหรือแสดงข้อผิดพลาด
 * @param message ข้อความที่ต้องการแสดง
 * @param type ประเภทของ Toast (success, error, warning, info)
 * @param options ตัวเลือกเพิ่มเติม เช่น ระยะเวลาแสดง, ตำแหน่ง
 */
export const showToast = (message: string, type: ToastType = "info", options?: ToastOptions) => {
  const defaultOptions = {
    duration: 5000,
    placement: "top-center" as ToastPlacement,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // กำหนดค่าสีตามประเภท
  let color: "success" | "warning" | "danger" | "primary" | "default" | "foreground" | "secondary";
  let iconText: string;

  switch (type) {
    case "success":
      color = "success";
      iconText = "✅";
      break;
    case "error":
      color = "danger";
      iconText = "❌";
      break;
    case "warning":
      color = "warning";
      iconText = "⚠️";
      break;
    default:
      color = "primary";
      iconText = "ℹ️";
  }

  // แสดง Toast
  addToast({
    title: message,
    color: color,
    radius: "full",
    timeout: mergedOptions.duration,
    hideCloseButton: false,
    shouldShowTimeoutProgress: true,
    icon: iconText,
    classNames: {
      base: "font-[family-name:var(--font-line-seed-sans)]",
      title: "font-semibold"
    }
  });
};