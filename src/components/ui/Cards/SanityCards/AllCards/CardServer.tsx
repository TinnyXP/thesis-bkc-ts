import { CardClient } from "@/components";
import { Post } from "@/types";
import { client } from "@/sanity/client";
import { POSTS_QUERY, defaultRevalidateOptions } from "@/utils/sanity";

/**
 * คอมโพเนนต์ที่ทำหน้าที่ดึงข้อมูลบทความจาก Sanity CMS (server-side)
 * และส่งต่อให้ CardClient แสดงผล
 */
export default async function CardServer() {
  try {
    // ดึงข้อมูลบทความจาก Sanity CMS
    const posts = await client.fetch<Post[]>(
      POSTS_QUERY, 
      {}, 
      defaultRevalidateOptions
    );
    
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

    // ส่งข้อมูลไปยัง CardClient เพื่อแสดงผล
    return <CardClient posts={posts} />;
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