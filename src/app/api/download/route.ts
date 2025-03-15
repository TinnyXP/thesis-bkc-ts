// API route สำหรับการดาวน์โหลดไฟล์

import { NextResponse } from 'next/server';

/**
 * Domain ที่อนุญาตให้ดาวน์โหลดไฟล์
 */
const ALLOWED_DOMAINS = ['cdn.sanity.io'];

/**
 * ขนาดไฟล์สูงสุดที่อนุญาตให้ดาวน์โหลด (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * ประเภทไฟล์ที่อนุญาตให้ดาวน์โหลด
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * ตรวจสอบว่า URL มาจาก domain ที่อนุญาตหรือไม่
 * @param url URL ที่ต้องการตรวจสอบ
 * @returns boolean บ่งบอกว่า URL นั้นมาจาก domain ที่อนุญาตหรือไม่
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_DOMAINS.includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

/**
 * ฟังก์ชันสำหรับจัดการการดาวน์โหลดไฟล์
 */
export async function GET(request: Request) {
  try {
    // ดึงพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('filename');

    // ตรวจสอบพารามิเตอร์
    if (!fileUrl) {
      return NextResponse.json(
        { error: 'ไม่พบ URL ของไฟล์' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า URL มาจากแหล่งที่อนุญาตหรือไม่
    if (!isValidUrl(fileUrl)) {
      return NextResponse.json(
        { error: 'ลิงก์ไม่ถูกต้องหรือไม่ได้รับอนุญาต' },
        { status: 403 }
      );
    }

    // ดาวน์โหลดไฟล์
    const response = await fetch(fileUrl);
    
    // ตรวจสอบการตอบสนองจากเซิร์ฟเวอร์
    if (!response.ok) {
      throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ได้: ${response.statusText}`);
    }

    // ตรวจสอบประเภทไฟล์
    const contentType = response.headers.get('content-type');
    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      throw new Error(`ประเภทไฟล์ไม่ถูกต้อง: ${contentType}`);
    }

    // ตรวจสอบขนาดไฟล์
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new Error(`ขนาดไฟล์ใหญ่เกินไป: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB (สูงสุด: ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    // สร้าง response สำหรับดาวน์โหลด
    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${fileName || 'image.jpg'}"`);
    headers.set('Cache-Control', 'no-cache');
    
    return new NextResponse(blob, { 
      headers, 
      status: 200 
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดาวน์โหลด:', error);
    const message = error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}