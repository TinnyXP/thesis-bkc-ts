// src/app/api/places/route.ts
import { NextResponse } from "next/server";
import { getLatestPlaces } from "@/lib/sanity/placeQueries";

export const dynamic = 'force-dynamic'; // ไม่ใช้ static generation เพื่อให้ข้อมูลอัพเดตตลอด

export async function GET() {
  try {
    const places = await getLatestPlaces(12);
    
    return NextResponse.json({ 
      success: true, 
      places
    });
  } catch (error) {
    console.error("Error fetching places:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสถานที่ท่องเที่ยว"
    }, { status: 500 });
  }
}