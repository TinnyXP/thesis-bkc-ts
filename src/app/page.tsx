import React from "react";
import { Footer, BlogCardList, NavBar } from "@/components";
import dynamic from "next/dynamic";

// Import WelcomePopup ด้วย dynamic import เพื่อให้ทำงานแค่ฝั่ง client
const WelcomePopup = dynamic(() => import('@/components/ui/Modals/WelcomePopup'), {
  ssr: false,
});

export default function Page() {
  return (
    <div className="font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />

      {/* เพิ่ม WelcomePopup */}
      <WelcomePopup />

      <section className="flex flex-col items-center gap-14 mt-5 mb-7">
        <BlogCardList />
      </section>

      <Footer />
    </div>
  )
}