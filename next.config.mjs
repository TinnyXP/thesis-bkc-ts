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
  
  // เพิ่มการตั้งค่า timeout สำหรับการเรียก fetch ภายนอก
  httpAgentOptions: {
    keepAlive: true,
    timeout: 10000, // 10 วินาที
  },
  
  // เพิ่มการควบคุม Static Generation ของหน้าต่างๆ
  staticPageGenerationTimeout: 60,  // 60 วินาที
  
  // ป้องกันการ pre-render หน้า Information ตอน build
  // เนื่องจากหน้านี้ต้องการข้อมูลจาก API ภายนอก จึงควรใช้ ISR หรือ SSR ไม่ใช่ SSG
  exportPathMap: async function (defaultPathMap) {
    // เอาหน้า information ออกจาก path ที่จะ export
    const pathMap = { ...defaultPathMap };
    delete pathMap['/information'];
    return pathMap;
  },
};