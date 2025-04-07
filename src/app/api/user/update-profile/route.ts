// // src/app/api/user/update-profile/route.ts
// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import UserModel from "@/models/user";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";
// import { uploadToCloudinary } from "@/lib/cloudinary";
// import mongoose from "mongoose";

// // ประเภทข้อมูลสำหรับการอัพเดท
// interface ProfileUpdateData {
//   name: string;
//   bio: string;
//   profile_image?: string;
// }

// export async function POST(request: Request) {
//   try {
//     // ตรวจสอบว่ามีการเข้าสู่ระบบ
//     const session = await getServerSession(authOptions);
//     if (!session || !session.user) {
//       return NextResponse.json({ 
//         success: false, 
//         message: "ไม่ได้รับอนุญาต" 
//       }, { status: 401 });
//     }

//     // ตรวจสอบว่า session.user.id ถูกต้องหรือไม่
//     if (!session.user.id || session.user.id === "new-user" || !mongoose.Types.ObjectId.isValid(session.user.id)) {
//       return NextResponse.json({ 
//         success: false, 
//         message: "ต้องสร้างโปรไฟล์ให้เสร็จสมบูรณ์ก่อน" 
//       }, { status: 400 });
//     }

//     // แปลงข้อมูลจาก FormData
//     const formData = await request.formData();
//     const name = formData.get("name") as string;
//     const bio = (formData.get("bio") as string) || "";
//     const profileImage = formData.get("profileImage") as File | null;

//     // ตรวจสอบข้อมูล
//     if (!name) {
//       return NextResponse.json({ 
//         success: false, 
//         message: "กรุณากรอกชื่อ" 
//       }, { status: 400 });
//     }

//     // เชื่อมต่อกับฐานข้อมูล
//     await connectDB();

//     // หาข้อมูลผู้ใช้จากฐานข้อมูล
//     const user = await UserModel.findById(session.user.id);
//     if (!user) {
//       return NextResponse.json({ 
//         success: false, 
//         message: "ไม่พบข้อมูลผู้ใช้" 
//       }, { status: 404 });
//     }

//     // ตั้งค่าข้อมูลที่จะอัพเดท
//     const updateData: ProfileUpdateData = {
//       name,
//       bio
//     };

//     // อัพโหลดรูปโปรไฟล์ใหม่ (ถ้ามี)
//     if (profileImage) {
//       try {
//         const uploadResult = await uploadToCloudinary(profileImage);
//         if (uploadResult && uploadResult.secure_url) {
//           updateData.profile_image = uploadResult.secure_url;
//         }
//       } catch (uploadError) {
//         console.error("Error uploading image to Cloudinary:", uploadError);
//         // ไม่อัพเดทรูปภาพหากมีข้อผิดพลาดในการอัพโหลด แต่ยังคงอัพเดทข้อมูลอื่น
//       }
//     }

//     // อัพเดทข้อมูลผู้ใช้
//     const updatedUser = await UserModel.findByIdAndUpdate(
//       session.user.id,
//       updateData,
//       { new: true } // คืนค่าข้อมูลหลังอัพเดท
//     );

//     return NextResponse.json({ 
//       success: true, 
//       message: "อัพเดทข้อมูลสำเร็จ",
//       user: {
//         id: updatedUser._id,
//         name: updatedUser.name,
//         email: updatedUser.email,
//         image: updatedUser.profile_image,
//         bio: updatedUser.bio
//       }
//     });
//   } catch (error) {
//     console.error("Error updating user profile:", error);
//     return NextResponse.json({ 
//       success: false, 
//       message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
//       error: error instanceof Error ? error.message : String(error)
//     }, { status: 500 });
//   }
// }

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
  profile_image?: string;
}

/**
 * แยก Public ID จาก Cloudinary URL
 * เช่น: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/bangkrachao/profiles/abc123.jpg
 * จะได้: bangkrachao/profiles/abc123
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

    // ตรวจสอบว่า session.user.id ถูกต้องหรือไม่
    if (!session.user.id || session.user.id === "new-user" || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ 
        success: false, 
        message: "ต้องสร้างโปรไฟล์ให้เสร็จสมบูรณ์ก่อน" 
      }, { status: 400 });
    }

    // แปลงข้อมูลจาก FormData
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const bio = (formData.get("bio") as string) || "";
    const profileImage = formData.get("profileImage") as File | null;

    // ตรวจสอบข้อมูล
    if (!name) {
      return NextResponse.json({ 
        success: false, 
        message: "กรุณากรอกชื่อ" 
      }, { status: 400 });
    }

    // เชื่อมต่อกับฐานข้อมูล
    await connectDB();

    // หาข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้" 
      }, { status: 404 });
    }

    // ตั้งค่าข้อมูลที่จะอัพเดท
    const updateData: ProfileUpdateData = {
      name,
      bio
    };

    // อัพโหลดรูปโปรไฟล์ใหม่ (ถ้ามี)
    if (profileImage) {
      try {
        // ลบรูปโปรไฟล์เก่าจาก Cloudinary (ถ้ามี)
        if (user.profile_image && user.profile_image.includes('cloudinary.com')) {
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
    }

    // อัพเดทข้อมูลผู้ใช้
    const updatedUser = await UserModel.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true } // คืนค่าข้อมูลหลังอัพเดท
    );

    return NextResponse.json({ 
      success: true, 
      message: "อัพเดทข้อมูลสำเร็จ",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.profile_image,
        bio: updatedUser.bio
      }
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