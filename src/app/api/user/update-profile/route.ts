// src/app/api/user/update-profile/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import mongoose from "mongoose";

// ประเภทข้อมูลสำหรับการอัพเดท
interface ProfileUpdateData {
  name: string;
  bio: string;
  profile_image?: string | null; // เพิ่ม null เป็นตัวเลือก
  use_original_data?: boolean;
}

/**
 * แยก Public ID จาก Cloudinary URL
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      console.log('Not a Cloudinary URL:', url);
      return null;
    }
    
    // แยก URL เป็นส่วนต่างๆ
    const matches = url.match(/\/v\d+\/([^/]+\/profiles\/[^.]+)/);
    if (matches && matches[1]) {
      console.log('Extracted public ID:', matches[1]);
      return matches[1];
    }
    
    // ใช้วิธีแยกตามพาธ (ถ้าวิธีข้างบนไม่ได้ผล)
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // หาส่วนที่มี 'upload' และดึงส่วนที่อยู่หลังจากนั้น
    const uploadIndex = pathParts.findIndex(p => p === 'upload');
    if (uploadIndex >= 0 && uploadIndex + 2 < pathParts.length) {
      // ข้าม version number (v1234567890)
      const publicIdParts = pathParts.slice(uploadIndex + 2);
      // ลบนามสกุลไฟล์จากส่วนสุดท้าย
      const lastPart = publicIdParts[publicIdParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        publicIdParts[publicIdParts.length - 1] = lastPart.split('.')[0];
      }
      
      const publicId = publicIdParts.join('/');
      console.log('Alternative public ID extraction:', publicId);
      return publicId;
    }
    
    console.log('Could not extract public ID from URL:', url);
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

/**
 * ตรวจสอบว่า id เป็น LINE ID หรือไม่
 */
function isLineUserId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('U');
}

// กำหนดให้ API นี้เป็น dynamic function เพื่อใช้ headers ได้
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }

    console.log('Session user in update profile:', {
      id: session.user.id,
      provider: session.user.provider,
      name: session.user.name,
      email: session.user.email
    });

    // แปลงข้อมูลจาก FormData
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const bio = (formData.get("bio") as string) || "";
    const useOriginalData = formData.get("use_original_data") === "true";
    const profileImage = formData.get("profileImage") as File | null;
    
    // ตรวจสอบข้อมูล
    if (!name && !useOriginalData) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณากรอกชื่อ" 
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // หาข้อมูลผู้ใช้จากฐานข้อมูล - ตรวจสอบตาม ID
    let user = null;
    if (session.user.id === 'new-user') {
      return NextResponse.json({ 
        success: false, 
        message: "ต้องสร้างโปรไฟล์ให้เสร็จสมบูรณ์ก่อน" 
      }, { status: 400 });
    } else if (isLineUserId(session.user.id)) {
      // ถ้าเป็น LINE ID ให้ค้นหาด้วย provider_id แทน
      console.log('Searching user by LINE provider_id');
      user = await UserModel.findOne({ 
        provider: 'line',
        provider_id: session.user.id
      });
    } else if (mongoose.Types.ObjectId.isValid(session.user.id)) {
      // ถ้าเป็น ObjectId ปกติ
      console.log('Searching user by MongoDB ObjectId');
      user = await UserModel.findById(session.user.id);
    } else {
      // กรณีอื่นๆ ที่ไม่รองรับ
      return NextResponse.json({ 
        success: false, 
        message: "รูปแบบ ID ไม่ถูกต้อง" 
      }, { status: 400 });
    }

    // ตรวจสอบว่าพบผู้ใช้หรือไม่
    if (!user) {
      console.log('User not found with ID:', session.user.id);
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }

    console.log('Found user:', {
      id: user._id,
      name: user.name,
      provider: user.provider
    });

    // ตั้งค่าข้อมูลที่จะอัพเดท
    const updateData: ProfileUpdateData = {
      name,
      bio,
      use_original_data: useOriginalData
    };

    // ถ้าเลือกใช้ข้อมูลต้นฉบับจาก LINE และเป็นผู้ใช้ LINE
    if (useOriginalData && user.provider === 'line' && user.original_line_data) {
      // ใช้ชื่อและรูปโปรไฟล์จากข้อมูลต้นฉบับของ LINE
      updateData.name = user.original_line_data.name;
      updateData.profile_image = user.original_line_data.profile_image;
      
      // ไม่ต้องอัพโหลดรูปโปรไฟล์ใหม่
      console.log('Using original LINE data:', updateData);
    } else {
      // ถ้าไม่ได้เลือกใช้ข้อมูลต้นฉบับ และมีการอัพโหลดรูปโปรไฟล์ใหม่
      if (profileImage) {
        try {
          // ลบรูปโปรไฟล์เก่าจาก Cloudinary (ถ้ามี)
          // แต่ไม่ลบรูปจาก LINE (ป้องกันการลบรูปที่อ้างอิงจาก LINE)
          if (user.profile_image && 
              user.profile_image.includes('cloudinary.com') && 
              (!user.original_line_data || user.profile_image !== user.original_line_data.profile_image)) {
                
            console.log('Found existing profile image:', user.profile_image);
            
            // ดึง public ID จาก URL
            const publicId = extractCloudinaryPublicId(user.profile_image);
            
            if (publicId) {
              try {
                console.log('Attempting to delete old image with public ID:', publicId);
                const deleteResult = await deleteFromCloudinary(publicId);
                console.log('Delete result:', deleteResult);
              } catch (deleteError) {
                console.error('Failed to delete old profile image:', deleteError);
                // ไม่หยุดการทำงานถ้าลบไม่สำเร็จ
              }
            }
          }
          
          // อัพโหลดรูปใหม่
          console.log('Uploading new profile image...');
          const uploadResult = await uploadToCloudinary(profileImage);
          
          if (uploadResult && uploadResult.secure_url) {
            console.log('New image uploaded:', uploadResult.secure_url);
            updateData.profile_image = uploadResult.secure_url;
          } else {
            console.error('Upload result is incomplete:', uploadResult);
          }
        } catch (uploadError) {
          console.error('Error handling profile image:', uploadError);
        }
      } else if (profileImage === null && formData.has("profileImage")) {
        // กรณีที่ต้องการลบรูปโปรไฟล์ (ส่ง profileImage เป็น null)
        updateData.profile_image = null;
        
        // ลบรูปเก่าจาก Cloudinary ถ้ามี และไม่ใช่รูปจาก LINE
        if (user.profile_image && 
            user.profile_image.includes('cloudinary.com') && 
            (!user.original_line_data || user.profile_image !== user.original_line_data.profile_image)) {
            
          // ดึง public ID จาก URL
          const publicId = extractCloudinaryPublicId(user.profile_image);
          
          if (publicId) {
            try {
              console.log('Attempting to delete old image with public ID:', publicId);
              await deleteFromCloudinary(publicId);
            } catch (deleteError) {
              console.error('Failed to delete old profile image:', deleteError);
            }
          }
        }
      }
    }

    // อัพเดทข้อมูลผู้ใช้ - ใช้ _id จากข้อมูลที่ค้นหาได้
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true } // คืนค่าข้อมูลหลังอัพเดท
    );

    // กำหนด interface สำหรับข้อมูลผู้ใช้ที่จะส่งกลับ
    interface UserResponse {
      id: mongoose.Types.ObjectId | string;
      name: string;
      email: string;
      image: string | null;
      bio: string;
      provider: string;
      use_original_data: boolean;
      original_line_data?: {
        name: string;
        email: string;
        profile_image: string | null;
      };
    }
    
    const userData: UserResponse = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.profile_image,
      bio: updatedUser.bio || "",
      provider: updatedUser.provider,
      use_original_data: updatedUser.use_original_data || false
    };
    
    // เพิ่มข้อมูลต้นฉบับจาก LINE ถ้ามี
    if (updatedUser.provider === 'line' && updatedUser.original_line_data) {
      userData.original_line_data = updatedUser.original_line_data;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "อัพเดทข้อมูลสำเร็จ",
      user: userData
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}