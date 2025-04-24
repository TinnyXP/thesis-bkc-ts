// src/hooks/useUsersManagement.ts
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { showToast } from '@/lib/toast';

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: 'user' | 'admin' | 'superadmin';
  provider: 'otp' | 'line';
  bkcId: string;
  isActive: boolean;
  profileCompleted: boolean;
  createdAt?: string;
}

export function useUsersManagement() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ดึงรายชื่อผู้ใช้ทั้งหมด
  const fetchUsers = useCallback(async (searchQuery?: string): Promise<User[]> => {
    setIsLoading(true);

    try {
      const url = new URL('/api/admin/users/list', window.location.origin);
      if (searchQuery) {
        url.searchParams.append('search', searchQuery);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        return result.users;
      } else {
        showToast(result.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้", "error");
        return [];
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้", "error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // เปลี่ยนสถานะการใช้งานของผู้ใช้ (บล็อก/ปลดบล็อก)
  const toggleUserStatus = useCallback(async (userId: string, isActive: boolean): Promise<boolean> => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      const result = await response.json();

      if (result.success) {
        const action = isActive ? "บล็อก" : "ปลดบล็อก";
        showToast(`${action}ผู้ใช้สำเร็จ`, "success");
        return true;
      } else {
        showToast(result.message || "ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้", "error");
        return false;
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      showToast("เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้", "error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ลบผู้ใช้งาน
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        showToast("ลบผู้ใช้สำเร็จ", "success");
        return true;
      } else {
        showToast(result.message || "ไม่สามารถลบผู้ใช้ได้", "error");
        return false;
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("เกิดข้อผิดพลาดในการลบผู้ใช้", "error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // แก้ไขข้อมูลผู้ใช้
  const updateUser = useCallback(async (userId: string, userData: Partial<User>): Promise<boolean> => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (result.success) {
        showToast("อัปเดตข้อมูลผู้ใช้สำเร็จ", "success");
        return true;
      } else {
        showToast(result.message || "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้", "error");
        return false;
      }
    } catch (error) {
      console.error("Error updating user:", error);
      showToast("เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้", "error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
 * ฟังก์ชันแก้ไขข้อมูลผู้ใช้โดยเฉพาะ
 */
  const editUserProfile = useCallback(async (
    userId: string,
    name: string,
    profileImage: File | null,
    removeProfileImage: boolean
  ): Promise<boolean> => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("name", name);

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      formData.append("removeProfileImage", removeProfileImage.toString());

      const response = await fetch(`/api/admin/users/${userId}/update-profile`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        showToast("อัปเดตข้อมูลผู้ใช้สำเร็จ", "success");
        return true;
      } else {
        showToast(result.message || "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้", "error");
        return false;
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      showToast("เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้", "error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isLoading,
    isProcessing,
    fetchUsers,
    toggleUserStatus,
    deleteUser,
    updateUser,
    editUserProfile // เพิ่ม function นี้
  };
}