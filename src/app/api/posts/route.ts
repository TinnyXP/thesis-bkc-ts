// src/app/api/posts/route.ts
import { NextResponse } from "next/server";
import { getLatestPosts } from "@/lib/sanity";

export const dynamic = 'force-dynamic'; // ไม่ใช้ static generation เพื่อให้ข้อมูลอัพเดตตลอด

export async function GET() {
  try {
    const posts = await getLatestPosts(12);
    
    return NextResponse.json({ 
      success: true, 
      posts
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลบทความ"
    }, { status: 500 });
  }
}