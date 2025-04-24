// src/hooks/useForumPosts.ts
import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/lib/toast';

export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  user_bkc_id: string;
  user_name: string;
  user_image: string | null;
  view_count: number;
  is_pinned: boolean;
  is_deleted: boolean;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ForumPostSubmitData {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

interface ForumPostPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

// ฟังก์ชันสำหรับดึงข้อมูลจาก API
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Hook สำหรับจัดการระบบกระทู้
 */
export function useForumPosts(
  initialCategory?: string,
  pageSize: number = 10
) {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // สร้าง URL สำหรับการดึงข้อมูล
  const getUrl = useCallback(() => {
    const url = new URL('/api/forum/posts', window.location.origin);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', pageSize.toString());
    return url.toString();
  }, [category, page, pageSize]);
  
  // ดึงข้อมูลกระทู้ทั้งหมด
  const { data, error, isLoading, mutate } = useSWR(getUrl(), fetcher);
  
  // เปลี่ยนหน้า
  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  // เปลี่ยนหมวดหมู่ที่ต้องการดู
  const changeCategory = useCallback((newCategory?: string) => {
    setCategory(newCategory);
    setPage(1); // รีเซ็ตหน้ากลับไปหน้าแรก
  }, []);
  
  // สร้างกระทู้ใหม่
  const createPost = useCallback(async (postData: ForumPostSubmitData) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนสร้างกระทู้", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนสร้างกระทู้" };
      }
      
      setIsSubmitting(true);
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลกระทู้
        mutate();
        showToast("สร้างกระทู้สำเร็จ", "success");
        return { success: true, post: result.post };
      } else {
        showToast(result.message || "ไม่สามารถสร้างกระทู้ได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error creating forum post:", error);
      showToast("เกิดข้อผิดพลาดในการสร้างกระทู้", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการสร้างกระทู้" 
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [session, mutate]);
  
  // ปักหมุดหรือยกเลิกการปักหมุดกระทู้ (สำหรับ admin เท่านั้น)
  const togglePin = useCallback(async (postId: string, isPinned: boolean) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนปักหมุดกระทู้", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนปักหมุดกระทู้" };
      }
      
      // ทำ optimistic update
      if (data && data.posts) {
        const updatedPosts = data.posts.map((post: ForumPost) => 
          post._id === postId ? { ...post, is_pinned: isPinned } : post
        );
        
        mutate({
          ...data,
          posts: updatedPosts
        }, false);
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_pinned: isPinned })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลกระทู้
        mutate();
        showToast(
          isPinned ? "ปักหมุดกระทู้สำเร็จ" : "ยกเลิกการปักหมุดกระทู้สำเร็จ", 
          "success"
        );
        return { success: true };
      } else {
        // ยกเลิก optimistic update ถ้าไม่สำเร็จ
        mutate();
        showToast(result.message || "ไม่สามารถปักหมุดกระทู้ได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error toggling pin status:", error);
      // ยกเลิก optimistic update ถ้าเกิดข้อผิดพลาด
      mutate();
      showToast("เกิดข้อผิดพลาดในการปักหมุดกระทู้", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการปักหมุดกระทู้" 
      };
    }
  }, [session, data, mutate]);
  
  // ลบกระทู้
  const deletePost = useCallback(async (postId: string) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนลบกระทู้", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนลบกระทู้" };
      }
      
      // ทำ optimistic update
      if (data && data.posts) {
        const updatedPosts = data.posts.filter(
          (post: ForumPost) => post._id !== postId
        );
        
        mutate({
          ...data,
          posts: updatedPosts
        }, false);
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลกระทู้
        mutate();
        showToast("ลบกระทู้สำเร็จ", "success");
        return { success: true };
      } else {
        // ยกเลิก optimistic update ถ้าไม่สำเร็จ
        mutate();
        showToast(result.message || "ไม่สามารถลบกระทู้ได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error deleting forum post:", error);
      // ยกเลิก optimistic update ถ้าเกิดข้อผิดพลาด
      mutate();
      showToast("เกิดข้อผิดพลาดในการลบกระทู้", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการลบกระทู้" 
      };
    }
  }, [session, data, mutate]);
  
  return {
    posts: data?.posts as ForumPost[] || [],
    pagination: data?.pagination as ForumPostPagination || { 
      currentPage: 1, 
      totalPages: 1, 
      totalItems: 0 
    },
    isLoading,
    isSubmitting,
    isError: error,
    currentPage: page,
    currentCategory: category,
    changePage,
    changeCategory,
    createPost,
    togglePin,
    deletePost,
    refreshPosts: mutate
  };
}