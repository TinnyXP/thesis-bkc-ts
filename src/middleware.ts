// src/middleware.ts (ปรับปรุง)
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// กำหนดเส้นทางที่ต้องล็อกอิน (Protected Routes)
const authRequiredRoutes = ['/complete-profile'];

// กำหนดเส้นทางที่เข้าถึงได้เฉพาะเมื่อไม่ได้ล็อกอิน (Auth Routes)
const authRoutes = ['/login'];

// เส้นทางพิเศษที่ต้องกรอกข้อมูลโปรไฟล์ให้เสร็จสิ้น
const requiresCompleteProfile = ['/user/settings', '/user/dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ตรวจสอบว่าเส้นทางปัจจุบันอยู่ในรายการที่ต้องล็อกอิน
  const isAuthRequired = authRequiredRoutes.some(route => pathname.startsWith(route));
  
  // ตรวจสอบว่าเส้นทางปัจจุบันเป็นเส้นทางล็อกอิน
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // ตรวจสอบว่าเส้นทางต้องการให้ผู้ใช้กรอกข้อมูลโปรไฟล์
  const isProfileRequired = requiresCompleteProfile.some(route => pathname.startsWith(route));
  
  // ตรวจสอบ token จาก next-auth
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // มี token แสดงว่าล็อกอินแล้ว
  const isLoggedIn = !!token;
  
  // 1. ถ้าอยู่ในหน้าที่ต้องล็อกอิน แต่ยังไม่ได้ล็อกอิน (เช่น complete-profile)
  if (isAuthRequired && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  // 2. ถ้าอยู่ในหน้าล็อกอินแล้ว แต่ล็อกอินแล้ว
  if (isAuthRoute && isLoggedIn) {
    if (token.isNewUser) {
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }
    // ตัดส่วนการ redirect ไปหน้า welcome ออก และให้ไปหน้าหลักแทน
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 3. ถ้าเป็นหน้า complete-profile แต่ไม่ใช่ผู้ใช้ใหม่
  if (pathname.startsWith('/complete-profile') && isLoggedIn && !token.isNewUser) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 4. ถ้าเป็นหน้า complete-profile แต่ไม่ได้ล็อกอิน (ป้องกันการเข้าถึงโดยตรง)
  if (pathname.startsWith('/complete-profile') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 5. เส้นทางที่จำเป็นต้องกรอกข้อมูลโปรไฟล์ให้เสร็จก่อน
  if (isProfileRequired && isLoggedIn && token.isNewUser) {
    return NextResponse.redirect(new URL('/complete-profile', request.url));
  }
  
  // ให้ request ผ่านไปยังหน้าต่อไป
  return NextResponse.next();
}

// กำหนดว่า middleware จะทำงานกับเส้นทางไหนบ้าง
export const config = {
  matcher: [
    // เส้นทางที่ต้องล็อกอิน
    '/complete-profile/:path*',
    '/user/:path*',
    
    // เส้นทางล็อกอิน
    '/login',
    
    // เส้นทางที่ต้องตรวจสอบสถานะล็อกอินเพิ่มเติม
    '/dashboard/:path*',
  ],
};