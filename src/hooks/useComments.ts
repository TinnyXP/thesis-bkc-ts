// src/hooks/useComments.ts
import useSWR from 'swr';
import { useCallback } from 'react';

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
  const { data, error, isLoading, mutate } = useSWR(
    `/api/comments/${postId}`, 
    fetcher, 
    {
      refreshInterval: 15000, // รีเฟรชทุก 15 วินาที
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );
  
  // เพิ่มคอมเมนต์ใหม่แบบ Optimistic Update
  const addComment = useCallback(async (content: string, parentId?: string) => {
    try {
      // ข้อมูลชั่วคราวสำหรับการอัพเดตแบบ optimistic
      const tempComment: Partial<Comment> = {
        _id: `temp-${Date.now()}`,
        post_id: postId,
        user_name: 'กำลังโหลด...',
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
      const response = await fetch(`/api/comments/${postId}`, {
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
  }, [postId, data, mutate]);

  return {
    comments: data?.comments as Comment[] || [],
    isLoading,
    isError: error,
    addComment,
    refreshComments: mutate
  };
}