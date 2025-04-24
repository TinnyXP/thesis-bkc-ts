// src/hooks/useComplaints.ts
import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/lib/toast';

export interface ComplaintResponse {
  content: string;
  admin_id: string;
  admin_name: string;
  created_at: string;
}

export interface Complaint {
  _id: string;
  title: string;
  content: string;
  location: string;
  images: string[];
  user_bkc_id: string;
  user_name: string;
  user_image: string | null;
  status: 'pending' | 'inprogress' | 'resolved' | 'rejected';
  is_anonymous: boolean;
  is_deleted: boolean;
  responses: ComplaintResponse[];
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ComplaintSubmitData {
  title: string;
  content: string;
  location?: string;
  category: string;
  is_anonymous?: boolean;
  tags?: string[];
  images?: File[];
}

interface ComplaintPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

// ฟังก์ชันสำหรับดึงข้อมูลจาก API
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Hook สำหรับจัดการระบบร้องเรียน
 */
export function useComplaints(
  initialStatus?: 'pending' | 'inprogress' | 'resolved' | 'rejected',
  initialCategory?: string,
  pageSize: number = 10
) {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(initialStatus);
  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // สร้าง URL สำหรับการดึงข้อมูล
  const getUrl = useCallback(() => {
    const url = new URL('/api/complaints', window.location.origin);
    if (status) url.searchParams.append('status', status);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', pageSize.toString());
    return url.toString();
  }, [status, category, page, pageSize]);
  
  // ดึงข้อมูลเรื่องร้องเรียนทั้งหมด
  const { data, error, isLoading, mutate } = useSWR(session ? getUrl() : null, fetcher);
  
  // เปลี่ยนหน้า
  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  // เปลี่ยนสถานะที่ต้องการดู
  const changeStatus = useCallback((newStatus?: 'pending' | 'inprogress' | 'resolved' | 'rejected') => {
    setStatus(newStatus);
    setPage(1); // รีเซ็ตหน้ากลับไปหน้าแรก
  }, []);
  
  // เปลี่ยนหมวดหมู่ที่ต้องการดู
  const changeCategory = useCallback((newCategory?: string) => {
    setCategory(newCategory);
    setPage(1); // รีเซ็ตหน้ากลับไปหน้าแรก
  }, []);
  
  // ส่งเรื่องร้องเรียนใหม่
  const submitComplaint = useCallback(async (complaintData: ComplaintSubmitData) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนส่งเรื่องร้องเรียน", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนส่งเรื่องร้องเรียน" };
      }
      
      setIsSubmitting(true);
      
      // สร้าง FormData สำหรับส่งข้อมูล
      const formData = new FormData();
      formData.append('title', complaintData.title);
      formData.append('content', complaintData.content);
      
      if (complaintData.location) {
        formData.append('location', complaintData.location);
      }
      
      formData.append('category', complaintData.category);
      formData.append('is_anonymous', complaintData.is_anonymous ? 'true' : 'false');
      
      if (complaintData.tags && complaintData.tags.length > 0) {
        formData.append('tags', complaintData.tags.join(','));
      }
      
      // เพิ่มรูปภาพ (ถ้ามี)
      if (complaintData.images && complaintData.images.length > 0) {
        complaintData.images.forEach(image => {
          formData.append('images', image);
        });
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลเรื่องร้องเรียน
        mutate();
        showToast("ส่งเรื่องร้องเรียนสำเร็จ", "success");
        return { success: true, complaint: result.complaint };
      } else {
        showToast(result.message || "ไม่สามารถส่งเรื่องร้องเรียนได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error submitting complaint:", error);
      showToast("เกิดข้อผิดพลาดในการส่งเรื่องร้องเรียน", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการส่งเรื่องร้องเรียน" 
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [session, mutate]);
  
  // ลบเรื่องร้องเรียน
  const deleteComplaint = useCallback(async (complaintId: string) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนลบเรื่องร้องเรียน", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนลบเรื่องร้องเรียน" };
      }
      
      // ทำ optimistic update
      if (data && data.complaints) {
        const updatedComplaints = data.complaints.filter(
          (complaint: Complaint) => complaint._id !== complaintId
        );
        
        mutate({
          ...data,
          complaints: updatedComplaints
        }, false);
      }
      
      // ส่งคำขอลบเรื่องร้องเรียน
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลเรื่องร้องเรียน
        mutate();
        showToast("ลบเรื่องร้องเรียนสำเร็จ", "success");
        return { success: true };
      } else {
        // ยกเลิก optimistic update ถ้าไม่สำเร็จ
        mutate();
        showToast(result.message || "ไม่สามารถลบเรื่องร้องเรียนได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error deleting complaint:", error);
      // ยกเลิก optimistic update ถ้าเกิดข้อผิดพลาด
      mutate();
      showToast("เกิดข้อผิดพลาดในการลบเรื่องร้องเรียน", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการลบเรื่องร้องเรียน" 
      };
    }
  }, [session, data, mutate]);
  
  return {
    complaints: data?.complaints as Complaint[] || [],
    pagination: data?.pagination as ComplaintPagination || { 
      currentPage: 1, 
      totalPages: 1, 
      totalItems: 0 
    },
    isLoading,
    isSubmitting,
    isError: error,
    currentPage: page,
    currentStatus: status,
    currentCategory: category,
    changePage,
    changeStatus,
    changeCategory,
    submitComplaint,
    deleteComplaint,
    refreshComplaints: mutate
  };
}