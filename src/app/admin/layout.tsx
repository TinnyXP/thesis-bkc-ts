import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ระบบจัดการ | บางกะเจ้า",
  description: "ระบบจัดการสำหรับผู้ดูแลระบบ",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-[family-name:var(--font-line-seed-sans)] bg-default-50 dark:bg-zinc-950 min-h-screen">
      {children}
    </div>
  );
}