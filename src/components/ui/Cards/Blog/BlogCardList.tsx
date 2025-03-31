// src/components/ui/Cards/SanityCards/AllCards/CardServer.tsx
import { BlogCard } from "@/components";
import { getLatestPosts, Post } from "@/lib/sanity";

/**
 * คอมโพเนนต์ที่ทำหน้าที่ดึงข้อมูลบทความจาก Sanity CMS (server-side)
 * และส่งต่อให้ BlogCard แสดงผล
 */
export default async function CardServer() {
  try {
    // ดึงข้อมูลบทความจาก Sanity CMS
    const posts = await getLatestPosts(12);
    
    // ถ้าไม่มีบทความ ให้แสดง null
    if (!posts || posts.length === 0) {
      return (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-4">ไม่พบบทความ</h2>
          <p className="text-gray-600 dark:text-gray-400">
            ขออภัย ยังไม่มีบทความในขณะนี้ โปรดกลับมาใหม่ในภายหลัง
          </p>
        </div>
      );
    }

    // ส่งข้อมูลไปยัง BlogCard เพื่อแสดงผล
    return <BlogCard posts={posts} />;
  } catch (error) {
    // กรณีเกิดข้อผิดพลาด
    console.error('Error fetching posts:', error);
    return (
      <div className="text-center py-10 text-red-500">
        <h2 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h2>
        <p>ไม่สามารถโหลดข้อมูลบทความได้ โปรดลองใหม่อีกครั้ง</p>
      </div>
    );
  }
}