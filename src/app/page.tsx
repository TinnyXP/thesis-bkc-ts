import React from "react";
import { Footer, NavBar, BlogCardList } from "@/components"

export default function page() {
  return (
    <div className="font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />

      <section className="flex flex-col items-center gap-14 mt-5 mb-7">
        <BlogCardList />
      </section>

      <Footer />
    </div>
  )
}
