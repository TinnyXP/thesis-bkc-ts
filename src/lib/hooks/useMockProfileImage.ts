import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook จำลองสำหรับจัดการรูปโปรไฟล์ โดยไม่ต้องอัพโหลดไปยัง Cloudinary
 * @param initialImageUrl URL รูปภาพเริ่มต้น (ถ้ามี)
 * @returns ฟังก์ชันและสถานะสำหรับจัดการรูปโปรไฟล์
 */
export const useMockProfileImage = (initialImageUrl: string | null = null) => {
  // สถานะของรูปภาพ
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Ref สำหรับ file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // อัพเดทสถานะเมื่อ initialImageUrl เปลี่ยน
  useEffect(() => {
    if (initialImageUrl !== previewUrl && !imageFile) {
      setPreviewUrl(initialImageUrl);
    }
  }, [initialImageUrl, previewUrl, imageFile]);
  
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
        throw new Error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      }
      
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('ขนาดรูปภาพต้องไม่เกิน 5MB');
      }
      
      // สร้าง preview URL
      const reader = new FileReader();
      reader.onload = () => {
        // ถ้ามี URL ก่อนหน้าที่สร้างจาก Blob ให้ revoke URL เก่า
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
        
        // สร้าง URL ใหม่
        const dataUrl = reader.result as string;
        setImageFile(file);
        setPreviewUrl(dataUrl);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดรูปภาพ');
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
    
    // รีเซ็ตค่าใน input element เพื่อให้สามารถเลือกไฟล์เดิมได้อีกครั้ง
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);
  
  // Reset ค่าทั้งหมดกลับไปค่าเริ่มต้น
  const resetToInitial = useCallback(() => {
    // ถ้ามี URL ที่สร้างไว้ให้ revoke URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setImageFile(null);
    setPreviewUrl(initialImageUrl);
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