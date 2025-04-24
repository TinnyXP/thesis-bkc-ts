// src/middleware.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// กำหนดเส้นทางที่ต้องล็อกอิน (Protected Routes)
const authRequiredRoutes = ['/welcome', '/complete-profile'];

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
  
  // ถ้าล็อกอินแล้ว ให้ตรวจสอบสถานะบัญชี
  if (isLoggedIn) {
    try {
      // ตรวจสอบสถานะบัญชีจาก token
      if (token.isActive === false) {
        // ถ้าบัญชีถูกระงับ ให้ redirect ไปหน้า login พร้อมแสดงข้อความแจ้งเตือน
        const url = new URL('/login', request.url);
        url.searchParams.set('blocked', 'true');
        return NextResponse.redirect(url);
      }
      
      // สำหรับเส้นทางที่ต้องเช็คเพิ่มเติม เช่น เส้นทางที่ผู้ดูแลระบบเท่านั้นที่เข้าถึงได้
      // ถ้าเป็นเส้นทาง admin แต่ไม่ใช่ admin ให้ redirect ไปหน้าหลัก
      if (pathname.startsWith('/admin')) {
        try {
          // เนื่องจาก middleware ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้โดยตรง
          // เราจำเป็นต้องตรวจสอบจาก token หรือใช้ API สำหรับตรวจสอบสิทธิ์
          // แต่ในที่นี้เราจะใช้วิธีง่ายๆ คือตรวจสอบจาก token.role (ถ้ามี)
          if (!token.role || (token.role !== 'admin' && token.role !== 'superadmin')) {
            return NextResponse.redirect(new URL('/', request.url));
          }
        } catch (error) {
          console.error("Error checking admin status in middleware:", error);
          // ในกรณีที่เกิดข้อผิดพลาด ให้ redirect ไปหน้าแรก
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch (error) {
      console.error("Error checking account status in middleware:", error);
    }
  }
  
  // 1. ถ้าอยู่ในหน้าที่ต้องล็อกอิน แต่ยังไม่ได้ล็อกอิน (เช่น welcome, complete-profile)
  if (isAuthRequired && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  // 2. ถ้าอยู่ในหน้าล็อกอินแล้ว แต่ล็อกอินแล้ว
  if (isAuthRoute && isLoggedIn) {
    // ลองใช้เส้นทางแบบตรงไปตรงมา
    if (token.isNewUser) {
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }
    console.log("Redirecting to welcome page"); // เพิ่ม log
    return NextResponse.redirect(new URL('/welcome', request.url));
  }
  
  // 3. ถ้าเป็นหน้า complete-profile แต่ไม่ใช่ผู้ใช้ใหม่
  if (pathname.startsWith('/complete-profile') && isLoggedIn && !token.isNewUser) {
    return NextResponse.redirect(new URL('/welcome', request.url));
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
    '/welcome/:path*',
    '/complete-profile/:path*',
    '/user/:path*',
    
    // เส้นทางล็อกอิน
    '/login',
    
    // เส้นทางที่ต้องตรวจสอบสถานะล็อกอินเพิ่มเติม
    '/dashboard/:path*',
    
    // เส้นทางของผู้ดูแลระบบ
    '/admin/:path*',
  ],
};