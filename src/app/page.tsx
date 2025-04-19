// src/app/page.tsx

import { Metadata } from "next";
import { BlogPreview, CTASection, FeatureSection, Footer, HeroSection, NavBar } from "@/components";

// กำหนด Metadata สำหรับ SEO
export const metadata: Metadata = {
  title: "บางกระเจ้า - ปอดสีเขียวของกรุงเทพฯ | Bangkrachao - The Green Lung of Bangkok",
  description: "ค้นพบความมหัศจรรย์ของบางกระเจ้า ปอดสีเขียวแห่งกรุงเทพฯ ด้วยข้อมูลสถานที่ท่องเที่ยว ประวัติศาสตร์ และกิจกรรมน่าสนใจ | Discover Bangkrachao, the green lung of Bangkok with tourist attractions, history, and activities.",
  keywords: "บางกระเจ้า, bangkrachao, green lung, ปอดสีเขียว, ท่องเที่ยวใกล้กรุงเทพ, ที่เที่ยวธรรมชาติ, สมุทรปราการ, เกาะกะเพาะหมู",
  authors: [{ name: "Bangkrachao Tourism Project" }],
  openGraph: {
    type: "website",
    url: "https://www.bangkrachao.com",
    title: "บางกระเจ้า - ปอดสีเขียวของกรุงเทพฯ",
    description: "ค้นพบความมหัศจรรย์ของบางกระเจ้า ปอดสีเขียวแห่งกรุงเทพฯ",
    siteName: "Bangkrachao",
    images: [
      {
        url: "/og-image.jpg", 
        width: 1200,
        height: 630,
        alt: "บางกระเจ้า - ปอดสีเขียวของกรุงเทพฯ"
      }
    ]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  }
};

export default function HomePage() {
  return (
    <div className="font-[family-name:var(--font-line-seed-sans)] min-h-screen bg-white dark:bg-black">
      <NavBar />
      
      <main>
        <HeroSection />
        <FeatureSection />
        {/* <BlogCardList /> */}
        <BlogPreview />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
}