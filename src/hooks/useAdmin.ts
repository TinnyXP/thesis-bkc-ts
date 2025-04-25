// src/hooks/useAdmin.ts
import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/lib/toast';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  permissions?: string[];
  bkcId?: string;
}

// ฟังก์ชันสำหรับดึงข้อมูลจาก API
const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Hook สำหรับจัดการกับ admin
 */
export function useAdmin() {
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);

  // ทดสอบว่าผู้ใช้ปัจจุบันเป็น admin หรือไม่
  const {
    data: adminData,
    error: adminError,
    mutate: mutateAdminCheck
  } = useSWR(
    session ? '/api/admin/check' : null,
    fetcher
  );

  // ดึงข้อมูล admin ทั้งหมด (สำหรับ superadmin เท่านั้น)
  const {
    data: adminsData,
    error: adminsError,
    mutate: mutateAdmins,
    isValidating: isLoadingAdmins
  } = useSWR(
    adminData?.isAdmin ? '/api/admin/users' : null,
    fetcher
  );

  // ตั้งค่า Super Admin เริ่มต้น (thesis.bangkachao.64@gmail.com)
  const setupSuperAdmin = useCallback(async () => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/admin/setup', {
        method: 'GET'
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message || "ตั้งค่า Super Admin สำเร็จ", "success");
        // รีเฟรชข้อมูล
        mutateAdminCheck();
        mutateAdmins();
        return { success: true, admin: result.admin };
      } else {
        showToast(result.message || "ไม่สามารถตั้งค่า Super Admin ได้", "error");
        return { success: false, message: result.message };
      }

    } catch (error) {
      console.error("Error setting up super admin:", error);
      showToast("เกิดข้อผิดพลาดในการตั้งค่า Super Admin", "error");
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการตั้งค่า Super Admin"
      };
    } finally {
      setIsProcessing(false);
    }
  }, [mutateAdminCheck, mutateAdmins]);

  // เพิ่ม admin ใหม่ (สำหรับ superadmin เท่านั้น)
  const addAdmin = useCallback(async (bkcId: string, permissions?: string[]) => {
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนเพิ่ม admin", "error");
        return { success: false, message: "กรุณาเข้าสู่ระบบก่อนเพิ่ม admin" };
      }

      setIsProcessing(true);

      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bkcId, permissions })
      });

      const result = await response.json();

      if (result.success) {
        // รีเฟรชข้อมูล admin ทั้งหมด
        await mutateAdmins();
        showToast(result.message || "เพิ่ม admin สำเร็จ", "success");
        return { success: true, admin: result.admin };
      } else {
        showToast(result.message || "ไม่สามารถเพิ่ม admin ได้", "error");
        return { success: false, message: result.message };
      }

    } catch (error) {
      console.error("Error adding admin:", error);
      showToast("เกิดข้อผิดพลาดในการเพิ่ม admin", "error");
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการเพิ่ม admin"
      };
    } finally {
      setIsProcessing(false);
    }
  }, [session, mutateAdmins]);

  // ลบ admin (สำหรับ superadmin เท่านั้น)
  // ลบสิทธิ์ admin (ไม่ลบบัญชี)
  const removeAdmin = useCallback(async (adminId: string): Promise<{success: boolean, message?: string}> => {
    setIsProcessing(true);
  
    try {
      if (!session) {
        showToast("กรุณาเข้าสู่ระบบก่อนดำเนินการ", "error");
        return {success: false, message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ"};
      }
  
      // ทำ optimistic update
      if (adminsData && adminsData.admins) {
        const updatedAdmins = adminsData.admins.filter(
          (admin: AdminUser) => admin.id !== adminId
        );
  
        // อัปเดตแบบ optimistic โดยไม่รอ API
        mutateAdmins({
          ...adminsData,
          admins: updatedAdmins
        }, false);
      }
  
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: 'DELETE'
      });
  
      const result = await response.json();
  
      if (result.success) {
        // รีเฟรชข้อมูล admin ทั้งหมดอีกครั้ง
        await mutateAdmins();
        return {success: true};
      } else {
        // ยกเลิก optimistic update ถ้าไม่สำเร็จ
        await mutateAdmins();
        showToast(result.message || "ไม่สามารถลบสิทธิ์ผู้ดูแลระบบได้", "error");
        return {success: false, message: result.message || "ไม่สามารถลบสิทธิ์ผู้ดูแลระบบได้"};
      }
  
    } catch (error) {
      console.error("Error removing admin permissions:", error);
      // ยกเลิก optimistic update ถ้าเกิดข้อผิดพลาด
      await mutateAdmins();
      showToast("เกิดข้อผิดพลาดในการลบสิทธิ์ผู้ดูแลระบบ", "error");
      return {success: false, message: "เกิดข้อผิดพลาดในการลบสิทธิ์ผู้ดูแลระบบ"};
    } finally {
      setIsProcessing(false);
    }
  }, [session, adminsData, mutateAdmins]);

  // แปลงข้อมูลต่างๆ เพื่อแสดงผล

  // แปลง role เป็นภาษาไทย
  const getRoleText = useCallback((role: string): string => {
    switch (role) {
      case 'superadmin': return 'ผู้ดูแลระบบสูงสุด';
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'user': return 'ผู้ใช้ทั่วไป';
      default: return role;
    }
  }, []);

  // แปลง permissions เป็นภาษาไทย
  const getPermissionText = useCallback((permission: string): string => {
    switch (permission) {
      case 'all': return 'ทั้งหมด';
      case 'general': return 'ทั่วไป';
      case 'complaints': return 'จัดการเรื่องร้องเรียน';
      case 'forum': return 'จัดการกระทู้';
      case 'users': return 'จัดการผู้ใช้';
      default: return permission;
    }
  }, []);

  // ฟังก์ชัน refresh ข้อมูล admins
  const refreshAdmins = useCallback(async () => {
    try {
      await mutateAdmins();
      return true;
    } catch (error) {
      return false;
    }
  }, [mutateAdmins]);

  return {
    isAdmin: adminData?.isAdmin || false,
    isSuperAdmin: adminData?.isSuperAdmin || false,
    user: adminData?.user as AdminUser,
    admins: adminsData?.admins as AdminUser[] || [],
    isLoading: !adminError && !adminData,
    isLoadingAdmins: isLoadingAdmins || (!adminsError && !adminsData && adminData?.isAdmin),
    isProcessing,
    isError: adminError,
    isErrorAdmins: adminsError,
    setupSuperAdmin,
    addAdmin,
    removeAdmin,
    getRoleText,
    getPermissionText,
    refreshAdmins
  };
}