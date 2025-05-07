// src/app/api/views/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PageView from "@/models/pageView";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('page_type');
    const slug = searchParams.get('slug');
    
    if (!pageType || !slug) {
      return NextResponse.json({
        success: false,
        message: "Missing required parameters"
      }, { status: 400 });
    }
    
    await connectDB();
    
    // นับจำนวนการเข้าชมทั้งหมด (นับเฉพาะ unique IP ต่อวัน)
    const uniqueViews = await PageView.aggregate([
      { 
        $match: { 
          page_type: pageType,
          slug: slug
        } 
      },
      {
        $group: {
          _id: { ip_address: "$ip_address", view_date: "$view_date" },
          count: { $sum: 1 }
        }
      },
      {
        $count: "total_unique_views"
      }
    ]);
    
    // นับจำนวนการเข้าชมทั้งหมด (รวมการเข้าชมซ้ำในวันเดียวกัน)
    const totalViews = await PageView.aggregate([
      { 
        $match: { 
          page_type: pageType,
          slug: slug
        } 
      },
      {
        $group: {
          _id: null,
          count: { $sum: "$view_count" }
        }
      }
    ]);
    
    const uniqueViewCount = uniqueViews.length > 0 ? uniqueViews[0].total_unique_views : 0;
    const totalViewCount = totalViews.length > 0 ? totalViews[0].count : 0;
    
    return NextResponse.json({
      success: true,
      unique_views: uniqueViewCount,
      total_views: totalViewCount
    });
    
  } catch (error) {
    console.error("Error getting view count:", error);
    return NextResponse.json({
      success: false,
      message: "Error getting view count"
    }, { status: 500 });
  }
}