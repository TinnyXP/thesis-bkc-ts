import React from "react";
import { Metadata } from "next";
import { getPlacesByType } from "@/lib/sanity/placeQueries";
import { PlaceTypeCardList } from "@/components";
import Link from "next/link";
import { notFound } from "next/navigation";

// กำหนด metadata แบบ dynamic จากข้อมูลประเภทสถานที่
export async function generateMetadata(
  { params }: { params: { type: string } }
): Promise<Metadata> {
  // ดึงข้อมูลสถานที่ตามประเภท
  const places = await getPlacesByType(params.type);
  
  if (!places || places.length === 0) {
    return {
      title: "ไม่พบสถานที่ท่องเที่ยว",
      description: "ไม่พบสถานที่ท่องเที่ยวตามประเภทที่ระบุ",
    };
  }
  
  const placeTypeName = places[0]?.placeType?.title || params.type;
  
  return {
    title: `${placeTypeName} - สถานที่ท่องเที่ยวบางกะเจ้า`,
    description: `รวมสถานที่ท่องเที่ยวประเภท${placeTypeName}ในบางกะเจ้า`,
  };
}

export default async function PlaceTypePage({
  params,
}: {
  params: { type: string };
}) {
  // ตรวจสอบว่ามีพารามิเตอร์ type หรือไม่
  if (!params.type) {
    notFound();
  }

  try {
    // ดึงข้อมูลสถานที่ตามประเภท
    const places = await getPlacesByType(params.type);
    
    // ถ้าไม่พบสถานที่ในประเภทนี้
    if (!places || places.length === 0) {
      notFound();
    }
    
    const placeTypeName = places[0]?.placeType?.title || params.type;

    return (
      <div>
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6">
            <Link 
              href="/place"
              className="text-primary-color hover:underline flex items-center gap-1 mb-4"
            >
              &larr; กลับไปหน้ารวมสถานที่ท่องเที่ยว
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">
              สถานที่ท่องเที่ยวประเภท {placeTypeName}
            </h1>
          </div>
          
          <PlaceTypeCardList type={params.type} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in PlaceTypePage:', error);
    notFound();
  }
}