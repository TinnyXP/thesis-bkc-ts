// src/app/api/reviews/place/[placeId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/review";
import User from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ดึงรีวิวของสถานที่
export async function GET(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    // ดึงค่า pagination จาก query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest'; // ตัวเลือกการเรียงลำดับ: newest, highest, lowest
    
    // คำนวณตำแหน่งเริ่มต้น
    const skip = (page - 1) * limit;
    
    await connectDB();
    
    // คำนวณจำนวนรีวิวทั้งหมด
    const totalReviews = await Review.countDocuments({ 
      place_id: params.placeId,
      is_deleted: false
    });

    // คำนวณคะแนนเฉลี่ย
    const ratingAgg = await Review.aggregate([
      { 
        $match: { 
          place_id: params.placeId,
          is_deleted: false
        } 
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          // นับจำนวนรีวิวในแต่ละระดับคะแนน
          ratingCounts: {
            $push: "$rating"
          }
        }
      }
    ]);

    let averageRating = 0;
    let ratingStats = [0, 0, 0, 0, 0]; // สำหรับเก็บจำนวนรีวิวแต่ละดาว (index 0 = 1 ดาว)

    if (ratingAgg.length > 0) {
      averageRating = parseFloat(ratingAgg[0].averageRating.toFixed(1));
      
      // นับจำนวนรีวิวในแต่ละระดับดาว
      if (ratingAgg[0].ratingCounts) {
        ratingAgg[0].ratingCounts.forEach((rating: number) => {
          if (rating >= 1 && rating <= 5) {
            ratingStats[rating - 1]++;
          }
        });
      }
    }

    // กำหนดเงื่อนไขการเรียงลำดับ
    let sortOption = { createdAt: -1 }; // เริ่มต้นเรียงตามวันที่ล่าสุด
    
    if (sort === 'highest') {
      sortOption = { rating: -1, createdAt: -1 }; // เรียงตามคะแนนสูงสุด
    } else if (sort === 'lowest') {
      sortOption = { rating: 1, createdAt: -1 }; // เรียงตามคะแนนต่ำสุด
    }
    
    // ดึงรีวิวของสถานที่
    const reviews = await Review.find({ 
      place_id: params.placeId,
      is_deleted: false
    })
    .sort(sortOption)
    .skip(skip)
    .limit(limit);
    
    // อัปเดตข้อมูลผู้ใช้ล่าสุด (เช่น รูปโปรไฟล์)
    const updatedReviews = await Promise.all(reviews.map(async (review) => {
      const reviewObj = review.toObject();
      
      try {
        // ดึงข้อมูลผู้ใช้ล่าสุดโดยใช้ user_bkc_id
        const user = await User.findOne({ bkc_id: reviewObj.user_bkc_id });
        
        // ถ้าพบข้อมูลผู้ใช้ ให้อัปเดตชื่อและรูปภาพ
        if (user) {
          return {
            ...reviewObj,
            user_name: user.name,  // ใช้ชื่อล่าสุด
            user_image: user.profile_image  // ใช้รูปล่าสุด
          };
        }
      } catch (error) {
        console.error(`Error fetching user data for review ${reviewObj._id}:`, error);
      }
      
      // ถ้าไม่พบข้อมูลผู้ใช้หรือเกิดข้อผิดพลาด คืนค่ารีวิวเดิม
      return reviewObj;
    }));
    
    // แปลงข้อมูล rating stats เป็นรูปแบบที่ UI ต้องการ
    const ratingsFormatted = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: ratingStats[rating - 1]
    }));
    
    // ส่งข้อมูล pagination และสถิติการรีวิวกลับไปด้วย
    return NextResponse.json({ 
      success: true, 
      reviews: updatedReviews,
      stats: {
        totalReviews,
        averageRating,
        ratingsFormatted
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalItems: totalReviews
      }
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว",
      reviews: []
    }, { status: 500 });
  }
}

// เพิ่มรีวิวใหม่
export async function POST(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนรีวิว" 
      }, { status: 401 });
    }

    const { rating, title, content } = await request.json();
    
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาให้คะแนน 1-5 ดาว" 
      }, { status: 400 });
    }
    
    if (!title || title.trim() === "") {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณากรอกหัวข้อรีวิว" 
      }, { status: 400 });
    }
    
    if (!content || content.trim() === "") {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณากรอกเนื้อหารีวิว" 
      }, { status: 400 });
    }

    await connectDB();
    
    // ตรวจสอบว่าผู้ใช้เคยรีวิวสถานที่นี้หรือไม่
    const existingReview = await Review.findOne({
      place_id: params.placeId,
      user_bkc_id: session.user.bkcId,
      is_deleted: false
    });
    
    if (existingReview) {
      return NextResponse.json({ 
        success: false, 
        message: "คุณได้รีวิวสถานที่นี้ไปแล้ว" 
      }, { status: 400 });
    }
    
    // ดึงข้อมูลผู้ใช้จาก DB เพื่อให้ได้ข้อมูลล่าสุด
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }
    
    // สร้างรีวิวใหม่
    const newReview = await Review.create({
      place_id: params.placeId,
      user_bkc_id: session.user.bkcId,
      user_name: user.name,
      user_image: user.profile_image,
      rating,
      title,
      content,
      is_deleted: false
    });
    
    return NextResponse.json({ 
      success: true, 
      review: newReview
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการเพิ่มรีวิว"
    }, { status: 500 });
  }
}