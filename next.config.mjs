/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com', 'cdn.sanity.io'], // เพิ่ม domain สำหรับรูปจาก Cloudinary และ Sanity
    formats: ['image/avif', 'image/webp'], // เพิ่มรูปแบบไฟล์ที่ใช้ในการ optimize
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose'], // เพิ่ม mongoose เป็น external package
  },
  i18n: {
    locales: ['th', 'en', 'zh'],
    defaultLocale: 'th',
    localeDetection: false // เพราะเราควบคุมเองผ่าน cookie
  },
  compress: true, // เปิดใช้งานการบีบอัดไฟล์
  poweredByHeader: false, // ปิด X-Powered-By header เพื่อความปลอดภัย
};

export default nextConfig;