// src/hooks/useComments.ts
import useSWR from 'swr';
import { useCallback } from 'react';
import { useSession } from 'next-auth/react';

// interface สำหรับ Comment
export interface Comment {
  _id: string;
  post_id: string;
  user_bkc_id: string;
  user_name: string;
  user_image: string | null;
  content: string;
  is_deleted: boolean;
  parent_id: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useComments(postId: string) {
  const { data: session } = useSession();
  const { data, error, isLoading, mutate } = useSWR(
    `/api/comments/post/${postId}`, // แก้เส้นทาง API ตรงนี้
    fetcher, 
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );
  
  // เพิ่มคอมเมนต์ใหม่แบบ Optimistic Update
  const addComment = useCallback(async (content: string, parentId?: string) => {
    try {
      if (!session?.user) {
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น" };
      }
      
      // ข้อมูลชั่วคราวสำหรับการอัพเดตแบบ optimistic
      const tempComment: Partial<Comment> = {
        _id: `temp-${Date.now()}`,
        post_id: postId,
        user_bkc_id: session.user.bkcId,
        user_name: session.user.name || 'กำลังโหลด...',
        user_image: session.user.image || null,
        content,
        parent_id: parentId || null,
        createdAt: new Date().toISOString(),
        is_deleted: false
      };
      
      // อัพเดต UI ทันที โดยเพิ่มคอมเมนต์ใหม่
      const currentComments = data?.comments || [];
      mutate(
        { 
          ...data, 
          comments: [tempComment, ...currentComments] 
        }, 
        false // false = ไม่โหลดข้อมูลใหม่จากเซิร์ฟเวอร์ทันที
      );
      
      // ส่งคำขอไปยังเซิร์ฟเวอร์
      const response = await fetch(`/api/comments/post/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          parentId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์
        mutate();
        return { success: true };
      } else {
        // ถ้าไม่สำเร็จ ให้โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์เพื่อยกเลิกการอัพเดตแบบ optimistic
        mutate();
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      // โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์เพื่อยกเลิกการอัพเดตแบบ optimistic
      mutate();
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์" 
      };
    }
  }, [postId, data, mutate, session]);

  // เพิ่มฟังก์ชันลบคอมเมนต์
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      if (!session?.user) {
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนลบความคิดเห็น" };
      }
      
      // อัพเดต UI ทันที แบบ optimistic โดยการทำ soft delete
      const currentComments = data?.comments || [];
      const updatedComments = currentComments.map((comment: Comment) => 
        comment._id === commentId 
          ? { ...comment, is_deleted: true } 
          : comment
      );
      
      mutate(
        { 
          ...data, 
          comments: updatedComments 
        }, 
        false // false = ไม่โหลดข้อมูลใหม่จากเซิร์ฟเวอร์ทันที
      );
      
      // ส่งคำขอไปยังเซิร์ฟเวอร์
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์
        mutate();
        return { success: true };
      } else {
        // ถ้าไม่สำเร็จ ให้โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์เพื่อยกเลิกการอัพเดตแบบ optimistic
        mutate();
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      // โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์เพื่อยกเลิกการอัพเดตแบบ optimistic
      mutate();
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการลบคอมเมนต์" 
      };
    }
  }, [data, mutate, session]);

  // ตรวจสอบว่าผู้ใช้เป็นเจ้าของคอมเมนต์หรือไม่
  const isCommentOwner = useCallback((comment: Comment) => {
    if (!session?.user) return false;
    return comment.user_bkc_id === session.user.bkcId;
  }, [session]);

  return {
    comments: data?.comments as Comment[] || [],
    isLoading,
    isError: error,
    addComment,
    deleteComment,
    isCommentOwner,
    refreshComments: mutate
  };
}