// src/app/api/places/district/[district]/route.ts
import { NextResponse } from "next/server";
import { getPlacesByDistrict } from "@/lib/sanity/placeQueries";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { district: string } }
) {
  try {
    const places = await getPlacesByDistrict(params.district);
    
    return NextResponse.json({ 
      success: true, 
      places
    });
  } catch (error) {
    console.error("Error fetching places by district:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสถานที่ท่องเที่ยว",
      places: []
    }, { status: 500 });
  }
}