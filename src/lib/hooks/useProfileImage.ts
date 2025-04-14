// src/lib/hooks/useProfileImage.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { imageService } from '@/lib/services/imageService';

/**
 * Custom hook สำหรับจัดการรูปโปรไฟล์
 * @param initialImageUrl URL รูปภาพเริ่มต้น (ถ้ามี)
 * @returns ฟังก์ชันและสถานะสำหรับจัดการรูปโปรไฟล์
 */
export const useProfileImage = (initialImageUrl: string | null = null) => {
  // สถานะของรูปภาพ
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl);
  const [isCloudinaryImage, setIsCloudinaryImage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref สำหรับ file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // อัพเดทสถานะเมื่อ initialImageUrl เปลี่ยน
  useEffect(() => {
    if (initialImageUrl !== previewUrl) {
      setPreviewUrl(initialImageUrl);
      setImageFile(null);
      
      // ตรวจสอบว่าเป็น Cloudinary URL หรือไม่
      if (initialImageUrl) {
        setIsCloudinaryImage(imageService.isCloudinaryUrl(initialImageUrl));
      } else {
        setIsCloudinaryImage(false);
      }
    }
  }, [initialImageUrl, previewUrl]);
  
  // ฟังก์ชันเปิด file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // จัดการเมื่อเลือกไฟล์
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (!file) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should not exceed 5MB');
      }
      
      // สร้าง preview URL
      const dataUrl = await imageService.createImagePreview(file);
      
      // อัพเดทสถานะ
      setImageFile(file);
      
      // ถ้ามี URL ก่อนหน้าที่ไม่ใช่ URL จาก Cloudinary ให้ revoke URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setPreviewUrl(dataUrl);
      setIsCloudinaryImage(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      console.error('Error handling image file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [previewUrl]);
  
  // ล้างรูปภาพที่เลือก
  const clearImage = useCallback(() => {
    // ถ้ามี URL ที่สร้างไว้ให้ revoke URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setImageFile(null);
    setPreviewUrl(null);
    setIsCloudinaryImage(false);
    
    // รีเซ็ตค่าใน input element เพื่อให้สามารถเลือกไฟล์เดิมได้อีกครั้ง
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);
  
  // Reset ค่าทั้งหมด
  const resetToInitial = useCallback(() => {
    // ถ้ามี URL ที่สร้างไว้ให้ revoke URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setImageFile(null);
    setPreviewUrl(initialImageUrl);
    setIsCloudinaryImage(initialImageUrl ? imageService.isCloudinaryUrl(initialImageUrl) : false);
    setError(null);
    
    // รีเซ็ตค่าใน input element
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, initialImageUrl]);
  
  return {
    // สถานะ
    imageFile,
    previewUrl,
    isCloudinaryImage,
    isLoading,
    error,
    fileInputRef,
    
    // Actions
    openFileDialog,
    handleFileChange,
    clearImage,
    resetToInitial,
    
    // ตรวจสอบว่ามีการเปลี่ยนแปลงจากค่าเริ่มต้นหรือไม่
    isDirty: previewUrl !== initialImageUrl
  };
};