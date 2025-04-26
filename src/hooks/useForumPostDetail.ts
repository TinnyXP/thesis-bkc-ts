// src/hooks/useForumPostDetail.ts
import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/lib/toast';
import { ForumPost } from './useForumPosts';

export interface ForumReply {
  _id: string;
  post_id: string;
  content: string;
  user_bkc_id: string;
  user_name: string;
  user_image: string | null;
  is_solution: boolean;
  is_deleted: boolean;
  parent_id?: string;
  createdAt: string;
  updatedAt: string;
}

interface ForumReplyPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

// ฟังก์ชันสำหรับดึงข้อมูลจาก API
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Hook สำหรับจัดการรายละเอียดกระทู้และการตอบกลับ
 * @param postId ID ของกระทู้
 */
export function useForumPostDetail(postId: string) {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // ดึงข้อมูลกระทู้
  const { 
    data: postData, 
    error: postError, 
    isLoading: isLoadingPost, 
    mutate: mutatePost 
  } = useSWR(postId ? `/api/forum/posts/${postId}` : null, fetcher);
  
  // สร้าง URL สำหรับการดึงข้อมูลการตอบกลับ
  const getRepliesUrl = useCallback(() => {
    const url = new URL(`/api/forum/posts/${postId}/replies`, window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', pageSize.toString());
    return url.toString();
  }, [postId, page, pageSize]);
  
  // ดึงข้อมูลการตอบกลับ
  const { 
    data: repliesData, 
    error: repliesError, 
    isLoading: isLoadingReplies, 
    mutate: mutateReplies 
  } = useSWR(postId ? getRepliesUrl() : null, fetcher);
  
  // เปลี่ยนหน้าการตอบกลับ
  const changeRepliesPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  // เพิ่มการตอบกลับใหม่
  const addReply = useCallback(async (content: string, parentId?: string) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนตอบกลับ", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนตอบกลับ" };
      }
      
      if (!content.trim()) {
        showToast("กรุณากรอกเนื้อหาการตอบกลับ", "error");
        return { success: false, message: "กรุณากรอกเนื้อหาการตอบกลับ" };
      }
      
      setIsSubmittingReply(true);
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content,
          parent_id: parentId 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลการตอบกลับ
        mutateReplies();
        showToast("เพิ่มการตอบกลับสำเร็จ", "success");
        return { success: true, reply: result.reply };
      } else {
        showToast(result.message || "ไม่สามารถเพิ่มการตอบกลับได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error adding reply:", error);
      showToast("เกิดข้อผิดพลาดในการเพิ่มการตอบกลับ", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการเพิ่มการตอบกลับ" 
      };
    } finally {
      setIsSubmittingReply(false);
    }
  }, [session, postId, mutateReplies]);
  
  // แก้ไขการตอบกลับ
  const editReply = useCallback(async (replyId: string, content: string) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนแก้ไขการตอบกลับ", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนแก้ไขการตอบกลับ" };
      }
      
      if (!content.trim()) {
        showToast("กรุณากรอกเนื้อหาการตอบกลับ", "error");
        return { success: false, message: "กรุณากรอกเนื้อหาการตอบกลับ" };
      }
      
      setIsUpdating(true);
      
      // ทำ optimistic update
      if (repliesData && repliesData.replies) {
        const updatedReplies = repliesData.replies.map((reply: ForumReply) => 
          reply._id === replyId ? { ...reply, content } : reply
        );
        
        mutateReplies({
          ...repliesData,
          replies: updatedReplies
        }, false);
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลการตอบกลับ
        mutateReplies();
        showToast("แก้ไขการตอบกลับสำเร็จ", "success");
        return { success: true };
      } else {
        // ยกเลิก optimistic update ถ้าไม่สำเร็จ
        mutateReplies();
        showToast(result.message || "ไม่สามารถแก้ไขการตอบกลับได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error editing reply:", error);
      // ยกเลิก optimistic update ถ้าเกิดข้อผิดพลาด
      mutateReplies();
      showToast("เกิดข้อผิดพลาดในการแก้ไขการตอบกลับ", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการแก้ไขการตอบกลับ" 
      };
    } finally {
      setIsUpdating(false);
    }
  }, [session, repliesData, mutateReplies]);
  
  // ลบการตอบกลับ
  const deleteReply = useCallback(async (replyId: string) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนลบการตอบกลับ", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนลบการตอบกลับ" };
      }
      
      // ทำ optimistic update
      if (repliesData && repliesData.replies) {
        const updatedReplies = repliesData.replies.filter(
          (reply: ForumReply) => reply._id !== replyId
        );
        
        mutateReplies({
          ...repliesData,
          replies: updatedReplies
        }, false);
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลการตอบกลับ
        mutateReplies();
        showToast("ลบการตอบกลับสำเร็จ", "success");
        return { success: true };
      } else {
        // ยกเลิก optimistic update ถ้าไม่สำเร็จ
        mutateReplies();
        showToast(result.message || "ไม่สามารถลบการตอบกลับได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error deleting reply:", error);
      // ยกเลิก optimistic update ถ้าเกิดข้อผิดพลาด
      mutateReplies();
      showToast("เกิดข้อผิดพลาดในการลบการตอบกลับ", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการลบการตอบกลับ" 
      };
    }
  }, [session, repliesData, mutateReplies]);
  
  // ทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง
  const markAsSolution = useCallback(async (replyId: string, isSolution: boolean) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง" };
      }
      
      setIsUpdating(true);
      
      // ทำ optimistic update
      if (repliesData && repliesData.replies) {
        const updatedReplies = repliesData.replies.map((reply: ForumReply) => {
          if (reply._id === replyId) {
            return { ...reply, is_solution: isSolution };
          } else if (isSolution && reply.is_solution) {
            // ถ้ากำลังตั้งเป็นคำตอบที่ถูกต้อง และคำตอบอื่นเป็นคำตอบที่ถูกต้องอยู่แล้ว ให้ยกเลิก
            return { ...reply, is_solution: false };
          }
          return reply;
        });
        
        mutateReplies({
          ...repliesData,
          replies: updatedReplies
        }, false);
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_solution: isSolution })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลการตอบกลับ
        mutateReplies();
        showToast(
          isSolution ? "ทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้องสำเร็จ" : "ยกเลิกการทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้องสำเร็จ", 
          "success"
        );
        return { success: true };
      } else {
        // ยกเลิก optimistic update ถ้าไม่สำเร็จ
        mutateReplies();
        showToast(result.message || "ไม่สามารถทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้องได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error marking as solution:", error);
      // ยกเลิก optimistic update ถ้าเกิดข้อผิดพลาด
      mutateReplies();
      showToast("เกิดข้อผิดพลาดในการทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง" 
      };
    } finally {
      setIsUpdating(false);
    }
  }, [session, repliesData, mutateReplies]);
  
  return {
    post: postData?.post as ForumPost,
    replies: repliesData?.replies as ForumReply[] || [],
    repliesPagination: repliesData?.pagination as ForumReplyPagination || { 
      currentPage: 1, 
      totalPages: 1, 
      totalItems: 0 
    },
    isLoadingPost,
    isLoadingReplies,
    isSubmittingReply,
    isUpdating,
    isErrorPost: postError,
    isErrorReplies: repliesError,
    currentRepliesPage: page,
    changeRepliesPage,
    addReply,
    editReply,
    deleteReply,
    markAsSolution,
    refreshPost: mutatePost,
    refreshReplies: mutateReplies
  };
}