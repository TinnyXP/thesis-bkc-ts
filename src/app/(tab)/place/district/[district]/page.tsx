import React from "react";
import { Metadata } from "next";
import { getPlacesByDistrict } from "@/lib/sanity/placeQueries";
import { PlaceDistrictCardList } from "@/components";
import Link from "next/link";
import { notFound } from "next/navigation";

// กำหนด metadata แบบ dynamic จากข้อมูลตำบล
export async function generateMetadata(
  { params }: { params: { district: string } }
): Promise<Metadata> {
  // ดึงข้อมูลสถานที่ตามตำบล
  const places = await getPlacesByDistrict(params.district);
  
  if (!places || places.length === 0) {
    return {
      title: "ไม่พบสถานที่ท่องเที่ยว",
      description: "ไม่พบสถานที่ท่องเที่ยวในตำบลที่ระบุ",
    };
  }
  
  const districtName = places[0]?.district?.title || params.district;
  
  return {
    title: `${districtName} - สถานที่ท่องเที่ยวบางกระเจ้า`,
    description: `รวมสถานที่ท่องเที่ยวใน${districtName} บางกระเจ้า`,
  };
}

export default async function PlaceDistrictPage({
  params,
}: {
  params: { district: string };
}) {
  // ตรวจสอบว่ามีพารามิเตอร์ district หรือไม่
  if (!params.district) {
    notFound();
  }

  try {
    // ดึงข้อมูลสถานที่ตามตำบล
    const places = await getPlacesByDistrict(params.district);
    
    // ถ้าไม่พบสถานที่ในตำบลนี้
    if (!places || places.length === 0) {
      notFound();
    }
    
    const districtName = places[0]?.district?.title || params.district;

    return (
      <div>
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6">
            <Link 
              href="/place"
              className="text-blue-600 hover:underline flex items-center gap-1 mb-4"
            >
              &larr; กลับไปหน้ารวมสถานที่ท่องเที่ยว
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">
              สถานที่ท่องเที่ยวในตำบล{districtName}
            </h1>
          </div>
          
          <PlaceDistrictCardList district={params.district} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in PlaceDistrictPage:', error);
    notFound();
  }
}