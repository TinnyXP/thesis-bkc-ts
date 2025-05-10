// src/app/api/places/type/[type]/route.ts
import { NextResponse } from "next/server";
import { getPlacesByType } from "@/lib/sanity/placeQueries";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const places = await getPlacesByType(params.type);
    
    return NextResponse.json({ 
      success: true, 
      places
    });
  } catch (error) {
    console.error("Error fetching places by type:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสถานที่ท่องเที่ยว"
    }, { status: 500 });
  }
}