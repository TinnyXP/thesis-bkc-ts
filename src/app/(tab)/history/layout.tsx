import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ประวัติความเป็นมา | บางกระเจ้า",
  description: "เรียนรู้ประวัติศาสตร์อันน่าสนใจของบางกระเจ้า พื้นที่สีเขียวสำคัญใกล้กรุงเทพฯ ที่มีเรื่องราวน่าสนใจนับร้อยปี",
  keywords: "ประวัติบางกระเจ้า, ตำนานบางกระเจ้า, ความเป็นมาของบางกระเจ้า, ทรงคนอง, บางน้ำผึ้ง, บางกระสอบ, บางกอบัว, บางยอ",
  openGraph: {
    title: "ประวัติความเป็นมา | บางกระเจ้า",
    description: "เรียนรู้ประวัติศาสตร์อันน่าสนใจของบางกระเจ้า",
    url: "https://www.bangkrachao.com/history",
    images: [
      {
        url: "/images/history-og.jpg",
        width: 1200,
        height: 630,
        alt: "ประวัติความเป็นมาของบางกระเจ้า"
      }
    ]
  }
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}