// src/hooks/useComplaintDetail.ts
import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/lib/toast';
import { Complaint } from './useComplaints';

// ฟังก์ชันสำหรับดึงข้อมูลจาก API
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Hook สำหรับจัดการเรื่องร้องเรียนรายการเดียวและการตอบกลับ
 * @param complaintId ID ของเรื่องร้องเรียน
 */
export function useComplaintDetail(complaintId: string) {
  const { data: session } = useSession();
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // ดึงข้อมูลเรื่องร้องเรียน
  const { 
    data, 
    error, 
    isLoading, 
    mutate 
  } = useSWR(session && complaintId ? `/api/complaints/${complaintId}` : null, fetcher);
  
  // เพิ่มการตอบกลับใหม่ (สำหรับ admin เท่านั้น)
  const addResponse = useCallback(async (content: string) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนตอบกลับ", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนตอบกลับ" };
      }
      
      if (!content.trim()) {
        showToast("กรุณากรอกเนื้อหาการตอบกลับ", "error");
        return { success: false, message: "กรุณากรอกเนื้อหาการตอบกลับ" };
      }
      
      setIsSubmittingResponse(true);
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/complaints/${complaintId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลเรื่องร้องเรียน
        mutate();
        showToast("เพิ่มการตอบกลับสำเร็จ", "success");
        return { success: true, response: result.response };
      } else {
        showToast(result.message || "ไม่สามารถเพิ่มการตอบกลับได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error adding response:", error);
      showToast("เกิดข้อผิดพลาดในการเพิ่มการตอบกลับ", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการเพิ่มการตอบกลับ" 
      };
    } finally {
      setIsSubmittingResponse(false);
    }
  }, [session, complaintId, mutate]);
  
  // อัปเดตสถานะเรื่องร้องเรียน (สำหรับ admin เท่านั้น)
  const updateStatus = useCallback(async (status: 'pending' | 'inprogress' | 'resolved' | 'rejected') => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนอัปเดตสถานะ", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนอัปเดตสถานะ" };
      }
      
      setIsUpdatingStatus(true);
      
      // ทำ optimistic update
      if (data && data.complaint) {
        mutate({
          ...data,
          complaint: {
            ...data.complaint,
            status
          }
        }, false);
      }
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // รีเฟรชข้อมูลเรื่องร้องเรียน
        mutate();
        showToast(`อัปเดตสถานะเป็น "${status}" สำเร็จ`, "success");
        return { success: true };
      } else {
        // ยกเลิก optimistic update ถ้าไม่สำเร็จ
        mutate();
        showToast(result.message || "ไม่สามารถอัปเดตสถานะได้", "error");
        return { success: false, message: result.message };
      }
      
    } catch (error) {
      console.error("Error updating status:", error);
      // ยกเลิก optimistic update ถ้าเกิดข้อผิดพลาด
      mutate();
      showToast("เกิดข้อผิดพลาดในการอัปเดตสถานะ", "error");
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" 
      };
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [session, complaintId, data, mutate]);
  
  // แปลงสถานะเป็นภาษาไทย
  const getStatusText = useCallback((status: string): string => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'inprogress': return 'กำลังดำเนินการ';
      case 'resolved': return 'แก้ไขแล้ว';
      case 'rejected': return 'ไม่อนุมัติ';
      default: return status;
    }
  }, []);
  
  // แปลงสถานะเป็นสี
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'pending': return 'warning';
      case 'inprogress': return 'primary';
      case 'resolved': return 'success';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  }, []);
  
  return {
    complaint: data?.complaint as Complaint,
    isLoading,
    isSubmittingResponse,
    isUpdatingStatus,
    isError: error,
    addResponse,
    updateStatus,
    getStatusText,
    getStatusColor,
    refreshComplaint: mutate
  };
}