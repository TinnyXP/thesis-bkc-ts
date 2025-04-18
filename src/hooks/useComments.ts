// src/hooks/useComments.ts
import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useProfile } from '@/hooks/useProfile';
import { showToast } from '@/lib/toast';

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

// interface สำหรับข้อมูล Pagination
export interface CommentPagination {
  currentPage: number;
  totalPages: number;
  totalComments: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useComments(postId: string, pageSize: number = 10) {
  const { data: session } = useSession();
  const { profile } = useProfile();
  const [page, setPage] = useState(1);
  
  const { data, error, isLoading, mutate } = useSWR(
    `/api/comments/post/${postId}?page=${page}&limit=${pageSize}`,
    fetcher, 
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );
  
  // ฟังก์ชันเปลี่ยนหน้า
  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  // เพิ่มคอมเมนต์ใหม่แบบ Optimistic Update
  const addComment = useCallback(async (content: string, parentId?: string) => {
    try {
      if (!session?.user) {
        showToast("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น" };
      }
      
      if (!content.trim()) {
        showToast("กรุณากรอกข้อความแสดงความคิดเห็น", "error");
        return { success: false, message: "กรุณากรอกข้อความแสดงความคิดเห็น" };
      }
      
      // ข้อมูลชั่วคราวสำหรับการอัพเดตแบบ optimistic
      const tempComment: Partial<Comment> = {
        _id: `temp-${Date.now()}`,
        post_id: postId,
        user_bkc_id: session.user.bkcId,
        user_name: profile?.name || session.user.name || 'กำลังโหลด...',
        user_image: profile?.image || session.user.image || null,
        content,
        parent_id: parentId || null,
        createdAt: new Date().toISOString(),
        is_deleted: false
      };
      
      // อัพเดต UI ทันที โดยเพิ่มคอมเมนต์ใหม่
      const currentComments = data?.comments || [];
      const currentPagination = data?.pagination || { currentPage: 1, totalPages: 1, totalComments: 0 };
      
      // เพิ่มคอมเมนต์ใหม่และปรับปรุงข้อมูล pagination
      mutate(
        { 
          ...data, 
          comments: [tempComment, ...currentComments],
          pagination: {
            ...currentPagination,
            totalComments: currentPagination.totalComments + 1,
            totalPages: Math.ceil((currentPagination.totalComments + 1) / pageSize)
          }
        }, 
        false
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
        showToast("เพิ่มความคิดเห็นเรียบร้อยแล้ว", "success");
        return { success: true };
      } else {
        // ถ้าไม่สำเร็จ ให้โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์เพื่อยกเลิกการอัพเดตแบบ optimistic
        mutate();
        showToast(result.message || "ไม่สามารถเพิ่มความคิดเห็นได้", "error");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      // โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์เพื่อยกเลิกการอัพเดตแบบ optimistic
      mutate();
      showToast("เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์" 
      };
    }
  }, [postId, data, mutate, session, profile, pageSize]);

  // เพิ่มฟังก์ชันลบคอมเมนต์
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      if (!session?.user) {
        showToast("กรุณาเข้าสู่ระบบก่อนลบความคิดเห็น", "error");
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
        false
      );
      
      // ส่งคำขอไปยังเซิร์ฟเวอร์
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์
        mutate();
        showToast("ลบความคิดเห็นเรียบร้อยแล้ว", "success");
        return { success: true };
      } else {
        // ถ้าไม่สำเร็จ ให้โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์เพื่อยกเลิกการอัพเดตแบบ optimistic
        mutate();
        showToast(result.message || "ไม่สามารถลบความคิดเห็นได้", "error");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      // โหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์เพื่อยกเลิกการอัพเดตแบบ optimistic
      mutate();
      showToast("เกิดข้อผิดพลาดในการลบความคิดเห็น", "error");
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
    pagination: data?.pagination as CommentPagination || { 
      currentPage: 1, 
      totalPages: 1, 
      totalComments: 0 
    },
    isLoading,
    isError: error,
    changePage,
    addComment,
    deleteComment,
    isCommentOwner,
    refreshComments: mutate,
    currentPage: page
  };
}