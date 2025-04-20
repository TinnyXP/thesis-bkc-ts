// src/app/place/page.tsx
import React from "react";
import { Metadata } from "next";
import { Footer, NavBar } from "@/components";
import { getAllPlaceTypes, getAllDistricts } from "@/lib/sanity/placeQueries";
import { PlaceCardList } from "@/components";
import Link from "next/link";

// Metadata สำหรับหน้ารวมสถานที่ท่องเที่ยว
export const metadata: Metadata = {
  title: "สถานที่ท่องเที่ยว - บางกระเจ้า",
  description: "รวมสถานที่ท่องเที่ยวน่าสนใจในบางกระเจ้า ที่คุณไม่ควรพลาด",
  keywords: "สถานที่ท่องเที่ยว บางกระเจ้า, ที่เที่ยวบางกระเจ้า, แหล่งท่องเที่ยวบางกระเจ้า",
};

export default async function PlacePage() {
  // ดึงข้อมูลประเภทสถานที่และตำบลทั้งหมด
  const placeTypes = await getAllPlaceTypes();
  const districts = await getAllDistricts();

  return (
    <div>
      <NavBar />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">สถานที่ท่องเที่ยวในบางกระเจ้า</h1>
        
        {/* แสดงประเภทสถานที่ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">ประเภทสถานที่</h2>
          <div className="flex flex-wrap gap-2">
            {placeTypes.map((type) => (
              <Link 
                key={type._id} 
                href={`/place/type/${type.slug.current}`}
                className="px-4 py-2 bg-primary-color hover:bg-primary-color/80 text-white rounded-full transition-colors"
              >
                {type.title}
              </Link>
            ))}
          </div>
        </div>
        
        {/* แสดงตำบล/พื้นที่ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">พื้นที่</h2>
          <div className="flex flex-wrap gap-2">
            {districts.map((district) => (
              <Link 
                key={district._id} 
                href={`/place/district/${district.slug.current}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              >
                {district.title}
              </Link>
            ))}
          </div>
        </div>
        
        {/* แสดงสถานที่ล่าสุด */}
        <div>
          <h2 className="text-xl font-semibold mb-4">สถานที่ท่องเที่ยวล่าสุด</h2>
          <PlaceCardList />
        </div>
      </div>
      <Footer />
    </div>
  );
}