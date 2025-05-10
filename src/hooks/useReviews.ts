// src/hooks/useReviews.ts
import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/lib/toast';

// สร้าง interface สำหรับ Review
export interface Review {
  _id: string;
  place_id: string;
  user_bkc_id: string;
  user_name: string;
  user_image: string | null;
  rating: number;
  title: string;
  content: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// interface สำหรับ Review Stats
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingsFormatted: {
    rating: number;
    count: number;
  }[];
}

// interface สำหรับ Pagination
export interface ReviewPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

// interface สำหรับข้อมูลที่ส่งกลับจาก API
interface ReviewsResponse {
  success: boolean;
  reviews: Review[];
  stats: ReviewStats;
  pagination: ReviewPagination;
  message?: string;
}

// ฟังก์ชันสำหรับดึงข้อมูลจาก API
const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useReviews(placeId: string, initialPage: number = 1, limit: number = 5) {
  const { data: session } = useSession();
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  
  // ดึงข้อมูลรีวิวด้วย SWR
  const { data, error, isLoading, mutate } = useSWR<ReviewsResponse>(
    `/api/reviews/place/${placeId}?page=${page}&limit=${limit}&sort=${sort}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );
  
  // ฟังก์ชันเปลี่ยนหน้า
  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  // ฟังก์ชันเปลี่ยนการเรียงลำดับ
  const changeSort = useCallback((newSort: 'newest' | 'highest' | 'lowest') => {
    setSort(newSort);
    setPage(1); // รีเซ็ตกลับไปหน้าแรกเมื่อเปลี่ยนการเรียงลำดับ
  }, []);
  
  // ฟังก์ชันเพิ่มรีวิวใหม่
  const addReview = useCallback(async (reviewData: {
    rating: number;
    title: string;
    content: string;
  }) => {
    try {
      if (!session?.user) {
        showToast("กรุณาเข้าสู่ระบบก่อนรีวิว", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนรีวิว" };
      }
      
      const response = await fetch(`/api/reviews/place/${placeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลรีวิว
        mutate();
        showToast("เพิ่มรีวิวเรียบร้อยแล้ว", "success");
        return { success: true };
      } else {
        showToast(result.message || "ไม่สามารถเพิ่มรีวิวได้", "error");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error adding review:", error);
      showToast("เกิดข้อผิดพลาดในการเพิ่มรีวิว", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการเพิ่มรีวิว" 
      };
    }
  }, [placeId, mutate, session]);
  
  // ฟังก์ชันลบรีวิว
  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      if (!session?.user) {
        showToast("กรุณาเข้าสู่ระบบก่อนลบรีวิว", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนลบรีวิว" };
      }
      
      // ทำ optimistic update ก่อน
      if (data && data.reviews) {
        const optimisticReviews = data.reviews.filter(review => review._id !== reviewId);
        
        // อัปเดต UI ทันที
        mutate({
          ...data,
          reviews: optimisticReviews,
          stats: {
            ...data.stats,
            totalReviews: data.stats.totalReviews - 1
          }
        }, false);
      }
      
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลรีวิว
        mutate();
        showToast("ลบรีวิวเรียบร้อยแล้ว", "success");
        return { success: true };
      } else {
        // รีเฟรชข้อมูลรีวิวกลับเป็นข้อมูลจริง (ยกเลิก optimistic update)
        mutate();
        showToast(result.message || "ไม่สามารถลบรีวิวได้", "error");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      // รีเฟรชข้อมูลรีวิวกลับเป็นข้อมูลจริง (ยกเลิก optimistic update)
      mutate();
      showToast("เกิดข้อผิดพลาดในการลบรีวิว", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการลบรีวิว" 
      };
    }
  }, [data, mutate, session]);
  
  // ตรวจสอบว่าเป็นเจ้าของรีวิวหรือไม่
  const isReviewOwner = useCallback((review: Review) => {
    if (!session?.user) return false;
    return review.user_bkc_id === session.user.bkcId;
  }, [session]);
  
  // ตรวจสอบว่าผู้ใช้เคยรีวิวสถานที่นี้หรือไม่
  const hasReviewed = useCallback(() => {
    if (!session?.user || !data?.reviews) return false;
    return data.reviews.some(review => review.user_bkc_id === session.user.bkcId);
  }, [session, data]);
  
  return {
    reviews: data?.reviews || [],
    stats: data?.stats || {
      totalReviews: 0,
      averageRating: 0,
      ratingsFormatted: []
    },
    pagination: data?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
    },
    isLoading,
    isError: error,
    changePage,
    changeSort,
    currentSort: sort,
    addReview,
    deleteReview,
    isReviewOwner,
    hasReviewed,
    refreshReviews: mutate
  };
}