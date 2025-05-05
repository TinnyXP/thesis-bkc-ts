// src/app/layout.tsx (ปรับปรุง)
import type { Metadata } from "next";
import "@/styles/globals.css";

import { Providers } from "@/app/providers";
import { ScrollToTop, AccountStatusChecker } from "@/components";

import localFont from "next/font/local";
import { Bai_Jamjuree } from "next/font/google";
import Script from "next/script";

// ฟอนต์เหมือนเดิม
const lineSeedSans = localFont({
  src: [
    { path: "../styles/fonts/LINESeedSansTH_W_Th.woff", weight: "100" },
    { path: "../styles/fonts/LINESeedSansTH_W_Rg.woff", weight: "400" },
    { path: "../styles/fonts/LINESeedSansTH_W_Bd.woff", weight: "700" },
    { path: "../styles/fonts/LINESeedSansTH_W_XBd.woff", weight: "800" },
    { path: "../styles/fonts/LINESeedSansTH_W_He.woff", weight: "900" },
  ],
  variable: "--font-line-seed-sans",
});

const baiJamjuree = Bai_Jamjuree({
  subsets: ["latin"],
  weight: ["400", "600"], // Regular & SemiBold
  variable: "--font-bai-jamjuree",
});

// Metadata พื้นฐาน
export const metadata: Metadata = {
  metadataBase: new URL("https://www.bangkrachao.com"),
  title: {
    default: "บางกะเจ้า - ปอดสีเขียวของกรุงเทพฯ",
    template: "%s | บางกะเจ้า"
  },
  description: "ค้นพบเรื่องราว ประวัติศาสตร์ และสถานที่ท่องเที่ยวน่าสนใจในบางกะเจ้า ปอดสีเขียวแห่งกรุงเทพฯ",
  openGraph: {
    siteName: "บางกะเจ้า",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@bangkrachao",
    title: "บางกะเจ้า - ปอดสีเขียวของกรุงเทพฯ",
    description: "ค้นพบเรื่องราว ประวัติศาสตร์ และสถานที่ท่องเที่ยวน่าสนใจในบางกะเจ้า",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.bangkrachao.com",
    languages: {
      'th': 'https://www.bangkrachao.com',
      'en': 'https://www.bangkrachao.com/en',
      'zh': 'https://www.bangkrachao.com/zh',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        {/* การเพิ่ม structured data สำหรับเว็บไซต์หลัก */}
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "บางกะเจ้า",
              "url": "https://www.bangkrachoa.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.bangkrachoa.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "บางกะเจ้า",
              "url": "https://www.bangkrachoa.com",
              "logo": "https://www.bangkrachoa.com/Bkj_logo.svg",
              "sameAs": [
                "https://www.facebook.com/bangkrachoa",
                "https://www.youtube.com/bangkrachoa"
              ]
            })
          }}
        />
      </head>
      <body className={`${lineSeedSans.variable} ${baiJamjuree.variable} antialiased`} >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
              {children}
            </main>
          </div>
          <ScrollToTop/>
          <AccountStatusChecker />
        </Providers>
      </body>
    </html>
  );
}