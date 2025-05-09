// next.config.mjs
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
  compress: true, // เปิดใช้งานการบีบอัดไฟล์
  poweredByHeader: false, // ปิด X-Powered-By header เพื่อความปลอดภัย
  
  // เพิ่มตัวเลือกสำหรับ build เพื่อป้องกันปัญหา timeout กับ API ภายนอก
  output: 'standalone',
};

export default nextConfig;