// src/lib/services/imageService.ts
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

/**
 * บริการจัดการรูปภาพ
 */
export class ImageService {
  /**
   * อัปโหลดรูปภาพไปยัง Cloudinary
   * @param file ไฟล์รูปภาพ
   * @param options ตัวเลือกในการอัปโหลด
   * @returns URL ของรูปภาพที่อัปโหลด
   */
  async uploadImage(
    file: File,
    options: {
      folder?: string;
      publicId?: string;
      transformations?: Array<{ [key: string]: any }>;
    } = {}
  ): Promise<{ url: string; publicId: string } | null> {
    try {
      console.log(`ImageService: Uploading image: ${file.name}, size: ${file.size / 1024} KB`);
      
      const result = await uploadToCloudinary(file);
      
      if (!result || !result.secure_url) {
        console.error("ImageService: Upload failed - incomplete result", result);
        return null;
      }
      
      console.log(`ImageService: Image uploaded successfully to: ${result.secure_url}`);
      
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      console.error("ImageService: Upload error:", error);
      return null;
    }
  }
  
  /**
   * ลบรูปภาพจาก Cloudinary
   * @param url URL ของรูปภาพที่ต้องการลบ
   * @returns ผลลัพธ์การลบ
   */
  async deleteImage(url: string): Promise<boolean> {
    try {
      // แยก publicId จาก URL
      const publicId = this.extractPublicIdFromUrl(url);
      
      if (!publicId) {
        console.warn(`ImageService: Cannot extract public ID from URL: ${url}`);
        return false;
      }
      
      console.log(`ImageService: Deleting image with public ID: ${publicId}`);
      
      const result = await deleteFromCloudinary(publicId);
      console.log("ImageService: Delete result:", result);
      
      return true;
    } catch (error) {
      console.error("ImageService: Delete error:", error);
      return false;
    }
  }
  
  /**
   * สร้าง data URL จากไฟล์รูปภาพ (ใช้สำหรับแสดงผลก่อนอัปโหลด)
   * @param file ไฟล์รูปภาพ
   * @returns data URL
   */
  async createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * ตรวจสอบว่า URL เป็น URL ของ Cloudinary หรือไม่
   * @param url URL ที่ต้องการตรวจสอบ
   * @returns ผลการตรวจสอบ
   */
  isCloudinaryUrl(url: string): boolean {
    return url?.includes('cloudinary.com') || false;
  }
  
  /**
   * แยก Public ID จาก Cloudinary URL
   * @param url Cloudinary URL
   * @returns Public ID
   */
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      if (!url || !this.isCloudinaryUrl(url)) {
        return null;
      }
      
      // วิธีที่ 1: แยกจาก path ส่วนที่มี "upload"
      const matches = url.match(/\/v\d+\/([^/]+\/[^.]+)/);
      if (matches && matches[1]) {
        return matches[1];
      }
      
      // วิธีที่ 2: แยกด้วย URL object
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
        
        return publicIdParts.join('/');
      }
      
      return null;
    } catch (error) {
      console.error("Error extracting public ID:", error);
      return null;
    }
  }
}

// Export instance สำหรับใช้งานทั่วไป
export const imageService = new ImageService();