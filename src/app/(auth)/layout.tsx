// src/app/(auth)/layout.tsx
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | บางกะเจ้า",
  description: "เข้าสู่ระบบด้วย LINE หรืออีเมล OTP",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ไม่รวม NavBar ในโครงสร้างนี้ เพื่อให้หน้า login ไม่มี NavBar
  return (
    <div className="font-[family-name:var(--font-line-seed-sans)]">
      {children}
    </div>
  );
}