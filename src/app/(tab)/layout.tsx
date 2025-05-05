// src/app/(tab)/layout.tsx
import React from "react";
import { Footer, NavBar, ScrollToTop } from "@/components";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "บางกะเจ้า - ปอดสีเขียวของกรุงเทพฯ",
  description: "เรียนรู้เกี่ยวกับบางกะเจ้า พื้นที่สีเขียวในจังหวัดสมุทรปราการ ใกล้กรุงเทพมหานคร",
};

export default function TabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <div className="font-[family-name:var(--font-line-seed-sans)] min-h-screen flex flex-col bg-white dark:bg-black">
      {/* Navbar - แสดงเหมือนกันทุกหน้า */}
      <NavBar />
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer - แสดงเหมือนกันทุกหน้า */}
      <Footer />
      
      {/* ScrollToTop Button */}
      <ScrollToTop />
    </div>
  );
}