/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com'], // เพิ่ม domain สำหรับรูปจาก Cloudinary
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose'], // เพิ่ม mongoose เป็น external package
  },
};

export default nextConfig;