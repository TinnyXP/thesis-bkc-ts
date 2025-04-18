// src/app/sitemap.ts
import { MetadataRoute } from 'next';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // คุณอาจดึงข้อมูลจาก API หรือฐานข้อมูลได้ที่นี่
  // เช่น เรียกรายการบทความทั้งหมดจาก Sanity CMS
  
  // ตัวอย่าง URL หลัก
  const routes = [
    '',
    '/blog',
    '/history',
    '/place',
    '/news',
    '/static',
  ].map((route) => ({
    url: `https://bangkrachao.com${route}`,
    lastModified: new Date().toISOString(),
    // แก้ไขตรงนี้ - ใช้ค่าที่กำหนดในประเภท "daily" | "always" | "hourly" | "weekly" | "monthly" | "yearly" | "never" แทน string
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));
  
  return [...routes];
}