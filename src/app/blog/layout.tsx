import React from "react";
import { Footer, NavBar } from "@/components";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "บทความ | บางกระเจ้า",
  description: "บทความและข่าวสารเกี่ยวกับบางกระเจ้า",
};

/**
 * Layout สำหรับหน้าบทความทั้งหมด
 * เพิ่ม NavBar และ Footer ให้กับทุกหน้าในส่วนบทความ
 * 
 * @param children - เนื้อหาของหน้า
 */
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}