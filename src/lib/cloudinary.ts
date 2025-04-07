// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// สร้าง interface สำหรับ result จาก Cloudinary
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
  url: string;
  [key: string]: string | number | boolean | object;
}

// ตั้งค่า Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * อัปโหลดไฟล์ไปยัง Cloudinary
 * @param file ไฟล์ที่จะอัปโหลด
 * @returns ผลลัพธ์การอัปโหลด หรือ null หากมีข้อผิดพลาด
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult | null> {
  try {
    // แปลงไฟล์เป็น base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;
    
    // แสดงรายละเอียดการอัพโหลด
    console.log('Uploading file to Cloudinary:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    
    // อัปโหลดไฟล์ไปยัง Cloudinary
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: 'bangkrachao/profiles',
          resource_type: 'auto',
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success, public_id:', result?.public_id);
            resolve(result as CloudinaryUploadResult);
          }
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
}

/**
 * ลบไฟล์จาก Cloudinary
 * @param publicId Public ID ของไฟล์ที่จะลบ
 * @returns ผลลัพธ์การลบ หรือ null หากมีข้อผิดพลาด
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    console.log('Deleting from Cloudinary with public ID:', publicId);
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { invalidate: true }, // เพิ่ม invalidate เพื่อให้แน่ใจว่าไฟล์ถูกลบจาก cache ด้วย
        (error, result) => {
          if (error) {
            console.error('Cloudinary delete error:', error);
            reject(error);
          } else {
            console.log('Cloudinary delete result:', result);
            resolve(result);
          }
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return null;
  }
}