import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ประวัติความเป็นมา | บาง%กะเจ้า",
  description: "เรียนรู้ประวัติศาสตร์อันน่าสนใจของบางกะเจ้า พื้นที่สีเขียวสำคัญใกล้กรุงเทพฯ ที่มีเรื่องราวน่าสนใจนับร้อยปี",
  keywords: "ประวัติบางกะเจ้า, ตำนานบางกะเจ้า, ความเป็นมาของบางกะเจ้า, ทรงคนอง, บางน้ำผึ้ง, บางกระสอบ, บางกอบัว, บางยอ",
  openGraph: {
    title: "ประวัติความเป็นมา | บางกะเจ้า",
    description: "เรียนรู้ประวัติศาสตร์อันน่าสนใจของบางกะเจ้า",
    url: "https://www.bangkrachao.com/history",
    images: [
      {
        url: "/images/history-og.jpg",
        width: 1200,
        height: 630,
        alt: "ประวัติความเป็นมาของบางกะเจ้า"
      }
    ]
  }
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}