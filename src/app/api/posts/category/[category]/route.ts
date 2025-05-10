// src/app/api/posts/category/[category]/route.ts
import { NextResponse } from "next/server";
import { getPostsByCategory } from "@/lib/sanity";

export const dynamic = 'force-dynamic'; // ไม่ใช้ static generation เพื่อให้ข้อมูลอัพเดตตลอด

export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  try {
    const posts = await getPostsByCategory(params.category);
    
    return NextResponse.json({ 
      success: true, 
      posts
    });
  } catch (error) {
    console.error("Error fetching category posts:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลบทความ"
    }, { status: 500 });
  }
}