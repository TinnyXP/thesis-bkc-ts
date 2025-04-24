// src/app/api/complaints/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Complaint from "@/models/complaint";
import User from "@/models/user";
import { uploadToCloudinary } from "@/lib/cloudinary";

/**
 * ดึงรายการเรื่องร้องเรียนทั้งหมด
 * สามารถกรองด้วย status และ category ได้
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" 
      }, { status: 401 });
    }

    await connectDB();
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
    
    // ดึงพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // สร้าง query filter
    const filter: Record<string, any> = { is_deleted: false };
    
    // ถ้าไม่ใช่ admin ให้ดึงเฉพาะเรื่องร้องเรียนของตัวเอง
    if (!isAdmin) {
      filter.user_bkc_id = session.user.bkcId;
    }
    
    // กรองตาม status ถ้ามีการระบุ
    if (status) {
      filter.status = status;
    }
    
    // กรองตาม category ถ้ามีการระบุ
    if (category) {
      filter.category = category;
    }
    
    // นับจำนวนทั้งหมด
    const total = await Complaint.countDocuments(filter);
    
    // ดึงข้อมูลเรื่องร้องเรียน
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // แปลงข้อมูลให้เหมาะสมกับการส่งกลับ
    const formattedComplaints = complaints.map(complaint => {
      // สำหรับการแสดงในรายการ ถ้าเป็น anonymous ให้ไม่แสดงข้อมูลผู้ร้องเรียน
      if (complaint.is_anonymous && !isAdmin) {
        return {
          ...complaint.toObject(),
          user_name: "ไม่เปิดเผยตัวตน",
          user_image: null,
          user_bkc_id: null
        };
      }
      return complaint;
    });
    
    return NextResponse.json({ 
      success: true, 
      complaints: formattedComplaints,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
    
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลเรื่องร้องเรียน",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * สร้างเรื่องร้องเรียนใหม่
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" 
      }, { status: 401 });
    }

    // รับข้อมูลจาก form (multipart/form-data)
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const location = formData.get('location') as string;
    const category = formData.get('category') as string;
    const isAnonymous = formData.get('is_anonymous') === 'true';
    const tags = formData.get('tags') as string;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title || !content || !category) {
      return NextResponse.json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน (หัวข้อ, เนื้อหา, และหมวดหมู่)"
      }, { status: 400 });
    }

    await connectDB();
    
    // ดึงข้อมูลผู้ใช้
    const user = await User.findOne({ bkc_id: session.user.bkcId });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้"
      }, { status: 404 });
    }
    
    // อัปโหลดรูปภาพ (ถ้ามี)
    const images: string[] = [];
    const imageFiles = formData.getAll('images') as File[];
    
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        if (file.size > 0) { // ตรวจสอบว่าไฟล์ไม่ว่างเปล่า
          try {
            const result = await uploadToCloudinary(file);
            if (result && result.secure_url) {
              images.push(result.secure_url);
            }
          } catch (uploadError) {
            console.error("Error uploading image:", uploadError);
          }
        }
      }
    }
    
    // แปลง tags จาก string เป็น array
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    // สร้างเรื่องร้องเรียนใหม่
    const newComplaint = await Complaint.create({
      title,
      content,
      location: location || '',
      category,
      user_bkc_id: user.bkc_id,
      user_name: user.name,
      user_image: user.profile_image,
      images,
      is_anonymous: isAnonymous,
      tags: tagsArray,
      is_deleted: false,
      status: 'pending',
      responses: []
    });
    
    return NextResponse.json({
      success: true,
      message: "สร้างเรื่องร้องเรียนสำเร็จ",
      complaint: newComplaint
    });
    
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างเรื่องร้องเรียน",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}