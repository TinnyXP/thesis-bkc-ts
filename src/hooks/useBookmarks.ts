// src/hooks/useBookmarks.ts 
import useSWR from 'swr';
import { useCallback } from 'react';
import { showToast } from "@/lib/toast";

// interface สำหรับ Bookmark
export interface Bookmark {
  _id: string;
  user_bkc_id: string;
  post_id: string;
  post_title: string;
  post_slug: string;
  post_category: string;
  post_image: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useBookmarks() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/bookmarks',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  // เพิ่มบุ๊คมาร์กใหม่
  const addBookmark = useCallback(async (postData: {
    post_id: string;
    post_title: string;
    post_slug: string;
    post_category: string;
    post_image?: string | undefined;
  }) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // อัพเดต cache ทันที
        mutate();
        showToast("เพิ่มบุ๊คมาร์กเรียบร้อยแล้ว", "success");
        return { success: true };
      } else {
        showToast(result.message || "ไม่สามารถเพิ่มบุ๊คมาร์กได้", "error");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error adding bookmark:", error);
      showToast("เกิดข้อผิดพลาดในการเพิ่มบุ๊คมาร์ก", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการเพิ่มบุ๊คมาร์ก" 
      };
    }
  }, [mutate]);

  // ลบบุ๊คมาร์ก
  const removeBookmark = useCallback(async (postId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${postId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // อัพเดต cache ทันที
        mutate();
        showToast("ลบบุ๊คมาร์กเรียบร้อยแล้ว", "success");
        return { success: true };
      } else {
        showToast(result.message || "ไม่สามารถลบบุ๊คมาร์กได้", "error");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
      showToast("เกิดข้อผิดพลาดในการลบบุ๊คมาร์ก", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการลบบุ๊คมาร์ก" 
      };
    }
  }, [mutate]);

  return {
    bookmarks: data?.bookmarks as Bookmark[] || [],
    isLoading,
    isError: error,
    addBookmark,
    removeBookmark,
    refreshBookmarks: mutate
  };
}

// ฮุคสำหรับตรวจสอบว่าบทความถูกบุ๊คมาร์กหรือไม่
export function usePostBookmarkStatus(postId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    postId ? `/api/bookmarks/${postId}` : null,
    fetcher
  );

  // สลับสถานะ bookmark (เพิ่ม/ลบ)
  const toggleBookmark = useCallback(async (postData: {
    post_id: string;
    post_title: string;
    post_slug: string;
    post_category: string;
    post_image?: string | undefined;
  }) => {
    try {
      if (data?.isBookmarked) {
        // ถ้ามีบุ๊คมาร์กแล้ว ให้ลบ
        const response = await fetch(`/api/bookmarks/${postId}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          // อัพเดต cache ทันที
          mutate({ ...data, isBookmarked: false, bookmarkId: null });
          showToast("ลบบุ๊คมาร์กเรียบร้อยแล้ว", "success");
          return { success: true, action: 'removed' };
        } else {
          showToast(result.message || "ไม่สามารถลบบุ๊คมาร์กได้", "error");
          return { success: false, message: result.message };
        }
      } else {
        // ถ้ายังไม่มีบุ๊คมาร์ก ให้เพิ่ม
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          // อัพเดต cache ทันที
          mutate({ ...data, isBookmarked: true, bookmarkId: result.bookmark._id });
          showToast("เพิ่มบุ๊คมาร์กเรียบร้อยแล้ว", "success");
          return { success: true, action: 'added' };
        } else {
          showToast(result.message || "ไม่สามารถเพิ่มบุ๊คมาร์กได้", "error");
          return { success: false, message: result.message };
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      showToast("เกิดข้อผิดพลาด", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาด" 
      };
    }
  }, [data, postId, mutate]);

  return {
    isBookmarked: data?.isBookmarked || false,
    bookmarkId: data?.bookmarkId || null,
    isLoading,
    isError: error,
    toggleBookmark,
    refreshStatus: mutate
  };
}