import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_DOMAINS = ['cdn.sanity.io'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * ตรวจสอบว่า URL มาจาก domain ที่อนุญาต
 * @param url URL ที่ต้องการตรวจสอบ
 * @returns true ถ้า URL มาจาก domain ที่อนุญาต
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
 * สร้างชื่อไฟล์รูปแบบ "bkc_[timestamp]" ตามที่กำหนด
 * @param fileType ประเภทของไฟล์ (MIME type)
 * @returns ชื่อไฟล์พร้อมนามสกุลที่เหมาะสม
 */
function generateSafeFilename(fileType: string): string {
  const timestamp = Date.now();
  
  // กำหนดนามสกุลไฟล์ตาม MIME type
  let extension = '.jpg'; // ค่าเริ่มต้น
  if (fileType === 'image/png') extension = '.png';
  if (fileType === 'image/webp') extension = '.webp';
  
  return `bkc_${timestamp}${extension}`;
}

/**
 * สร้าง Response แบบ plain text สำหรับแสดงข้อผิดพลาด
 * @param message ข้อความแสดงข้อผิดพลาด
 * @param status รหัสสถานะ HTTP
 * @returns NextResponse ที่ตั้งค่าแล้ว
 */
function createErrorResponse(message: string, status: number = 400): NextResponse {
  return new NextResponse(message, { 
    status,
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8'
    }
  });
}

export async function GET(request: Request) {
  // ดึงพารามิเตอร์จาก URL
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    // ตรวจสอบว่ามี URL หรือไม่
    if (!fileUrl) {
      return createErrorResponse('ไม่พบ URL สำหรับการดาวน์โหลด', 400);
    }

    // ตรวจสอบว่า URL มาจาก domain ที่อนุญาต
    if (!isValidUrl(fileUrl)) {
      return createErrorResponse('URL ไม่ได้รับอนุญาตให้ดาวน์โหลด', 403);
    }

    // ดาวน์โหลดไฟล์
    let response;
    try {
      response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*'
        }
      });
    } catch (fetchError) {
      console.error('เกิดข้อผิดพลาดในการเรียก fetch:', fetchError);
      return createErrorResponse('ไม่สามารถเชื่อมต่อกับแหล่งข้อมูลได้', 500);
    }

    // ตรวจสอบสถานะการตอบกลับ
    if (!response.ok) {
      return createErrorResponse(
        `การดาวน์โหลดล้มเหลว: ${response.status} ${response.statusText}`, 
        502 // Bad Gateway
      );
    }

    // ตรวจสอบประเภทไฟล์
    const contentType = response.headers.get('content-type');
    if (!contentType) {
      return createErrorResponse('ไม่สามารถตรวจสอบประเภทของไฟล์ได้', 400);
    }
    
    if (!ALLOWED_TYPES.includes(contentType)) {
      return createErrorResponse(
        `ประเภทไฟล์ ${contentType} ไม่ได้รับอนุญาตให้ดาวน์โหลด`, 
        415 // Unsupported Media Type
      );
    }

    // ตรวจสอบขนาดไฟล์
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return createErrorResponse(
        `ขนาดไฟล์ (${Math.round(parseInt(contentLength) / 1024 / 1024)} MB) ใหญ่เกินกว่าที่อนุญาต (${MAX_FILE_SIZE / 1024 / 1024} MB)`,
        413 // Payload Too Large
      );
    }

    // สร้างชื่อไฟล์ที่ปลอดภัย
    const safeFileName = generateSafeFilename(contentType);

    // แปลงข้อมูลเป็น Blob
    let blob;
    try {
      blob = await response.blob();
    } catch (blobError) {
      console.error('เกิดข้อผิดพลาดในการอ่าน blob:', blobError);
      return createErrorResponse('ไม่สามารถอ่านข้อมูลไฟล์ได้', 500);
    }

    // สร้าง Headers สำหรับการตอบกลับ
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${safeFileName}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // ส่งข้อมูลกลับไป
    return new NextResponse(blob, { 
      status: 200, 
      headers 
    });
    
  } catch (error) {
    // จัดการข้อผิดพลาดทั้งหมด
    console.error('เกิดข้อผิดพลาดในการดาวน์โหลด:', error);
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    return createErrorResponse(errorMessage, 500);
  }
}