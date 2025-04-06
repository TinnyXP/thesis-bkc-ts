/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com'], // เพิ่ม domain สำหรับรูปจาก Cloudinary
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose'], // เพิ่ม mongoose เป็น external package
  },
  // เพิ่มการตั้งค่า API
  api: {
    bodyParser: {
      sizeLimit: '10mb', // เพิ่มขนาดไฟล์ที่อัปโหลดได้
    },
  },
};

export default nextConfig;