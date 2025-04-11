"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card, CardBody, CardHeader, Divider, Button, Input, Textarea, Tooltip,
  Tabs, Tab, Accordion, AccordionItem, Pagination, Spinner
} from "@heroui/react";
import { FaCamera, FaRegEdit, FaHistory, FaUser, FaUserEdit, FaTrashAlt } from "react-icons/fa";
import { SiLine } from "react-icons/si";
import { FiLogOut, FiRefreshCw } from "react-icons/fi";
import { NavBar, Footer } from "@/components";

// อินเตอร์เฟซสำหรับประวัติการเข้าสู่ระบบ
interface LoginHistoryItem {
  _id: string;
  session_id: string;
  login_time: string;
  ip_address: string;
  user_agent: string;
  device_info?: string;
  location?: string;
  session_logout_date?: string;
  is_current_ip?: boolean;
  logout_reason?: string;
}

// อินเตอร์เฟซสำหรับประวัติการเข้าสู่ระบบแบบจัดกลุ่ม
interface GroupedLoginHistory {
  _id: string;
  ip_address: string;
  count: number;
  lastLogin: string;
  is_current_ip: boolean;
  sessions: {
    _id: string;
    session_id: string;
    login_time: string;
    user_agent: string;
    device_info?: string;
    location?: string;
    session_logout_date?: string;
    is_current_session: boolean;
  }[];
}

// อินเตอร์เฟซสำหรับข้อมูลต้นฉบับจาก LINE
interface OriginalLineData {
  name: string;
  email: string;
  profile_image: string;
}

// อินเตอร์เฟซสำหรับข้อมูลผู้ใช้จาก API
interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string;
  provider: string;
  original_line_data?: OriginalLineData;
  use_original_data?: boolean;
}

// อินเตอร์เฟซสำหรับการแบ่งหน้า
interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // สถานะสำหรับข้อมูลผู้ใช้
  const [userData, setUserData] = useState<UserProfile | null>(null);

  // สถานะสำหรับการแก้ไขข้อมูล
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [originalLineData, setOriginalLineData] = useState<OriginalLineData | null>(null);
  const [useOriginalData, setUseOriginalData] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // สถานะสำหรับประวัติการเข้าสู่ระบบ
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedLoginHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [viewMode, setViewMode] = useState<"grouped" | "all">("grouped");
  const [isLoggingOut, setIsLoggingOut] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, pages: 1 });

  // ใช้ useCallback สำหรับฟังก์ชัน fetchUserProfile
  const fetchUserProfile = useCallback(async () => {
    if (!session?.user?.id || session?.user?.id === "new-user") return;

    try {
      setIsLoading(true);
      console.log("ProfilePage: Fetching user profile data for user ID:", session.user.id);
      
      const response = await fetch('/api/user/get-profile', {
        // ป้องกันการใช้ cache
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching user profile:", response.status, errorText);
        setError(`ไม่สามารถดึงข้อมูลได้ (${response.status})`);
        return;
      }

      const data = await response.json();
      console.log("ProfilePage: User profile data response:", data);

      if (data.success) {
        // เก็บข้อมูลผู้ใช้ที่ได้จาก API
        setUserData(data.user);
        setNeedsRefresh(false);

        // อัพเดทข้อมูลในฟอร์ม
        setName(data.user.name || "");
        setBio(data.user.bio || "");

        if (data.user.image) {
          setPreviewUrl(data.user.image);
        }

        // เก็บข้อมูลต้นฉบับจาก LINE
        if (data.user.original_line_data) {
          setOriginalLineData(data.user.original_line_data);
        }

        // ตั้งค่าการใช้ข้อมูลต้นฉบับ
        setUseOriginalData(data.user.use_original_data || false);
        
        // อัพเดท session ด้วยข้อมูลล่าสุด
        if (data.user.name !== session.user.name || data.user.image !== session.user.image) {
          console.log("ProfilePage: Updating session with new profile data");
          await update({
            ...session,
            user: {
              ...session.user,
              name: data.user.name,
              image: data.user.image
            }
          });
        }
      } else {
        console.log("ProfilePage: Failed to get user profile:", data.message);
        setError(data.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    } finally {
      setIsLoading(false);
    }
  }, [session, update]);

  // ใช้ useCallback สำหรับฟังก์ชัน fetchLoginHistory
  const fetchLoginHistory = useCallback(async (page = 1, mode = viewMode) => {
    if (!session?.user?.id || session?.user?.id === "new-user") return;

    setIsLoadingHistory(true);
    console.log("ProfilePage: Fetching login history, page:", page, "mode:", mode);
    
    try {
      const groupByIp = mode === "grouped";
      const response = await fetch(`/api/user/login-history?page=${page}&limit=10&groupByIp=${groupByIp}`, {
        // ป้องกันการใช้ cache
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching login history:", response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log("ProfilePage: Login history response:", data);

      if (data.success) {
        if (groupByIp) {
          setGroupedHistory(data.groupedHistory || []);
        } else {
          setLoginHistory(data.history || []);
        }

        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      } else {
        console.error("Failed to fetch login history:", data.message);
      }
    } catch (error) {
      console.error("Error fetching login history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [session?.user?.id, viewMode]);

  // เมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อคอมโพเนนต์โหลด
    console.log("ProfilePage: Checking session status", {
      status,
      id: session?.user?.id,
      isNewUser: session?.user?.isNewUser
    });

    // ถ้าไม่ได้ล็อกอิน ให้เปลี่ยนเส้นทางไปหน้า login
    if (status === "unauthenticated") {
      console.log("ProfilePage: Not authenticated, redirecting to login");
      router.replace('/login');
      return;
    }

    // ถ้าเป็นผู้ใช้ใหม่ที่ยังไม่ได้สร้างโปรไฟล์ ให้ไปที่หน้าสร้างโปรไฟล์
    if (status === "authenticated" && (session.user.id === 'new-user' || session.user.isNewUser)) {
      console.log("ProfilePage: New user detected, redirecting to create-profile");
      router.replace('/create-profile');
      return;
    }

    // ตรวจสอบว่ามีการล็อกเอาท์จาก sessionStorage หรือไม่
    const loggedOut = sessionStorage.getItem('logged_out');
    if (loggedOut === 'true') {
      console.log("ProfilePage: User logged out, redirecting to login");
      sessionStorage.removeItem('logged_out');
      router.replace('/login');
      return;
    }

    // ตรวจสอบว่ามีการอัพเดท session จาก sessionStorage หรือไม่
    const sessionUpdated = sessionStorage.getItem('session_updated');
    if (sessionUpdated === 'true') {
      console.log("ProfilePage: Session was updated, setting needsRefresh");
      setNeedsRefresh(true);
      sessionStorage.removeItem('session_updated');
    }

    // ตั้งค่าข้อมูลเริ่มต้นเมื่อมีข้อมูล session
    if (status === "authenticated" && session?.user && session.user.id !== 'new-user') {
      // ดึงข้อมูลผู้ใช้จาก API
      fetchUserProfile();

      // ดึงข้อมูลประวัติการเข้าสู่ระบบ
      fetchLoginHistory(1, viewMode);
    }
  }, [session, status, router, fetchUserProfile, fetchLoginHistory, viewMode]);

  // อัพเดทการดึงข้อมูลเมื่อเปลี่ยนโหมดการแสดงผล
  useEffect(() => {
    if (session?.user?.id && session.user.id !== 'new-user') {
      fetchLoginHistory(1, viewMode);
    }
  }, [viewMode, fetchLoginHistory, session?.user?.id]);

  // ล้าง URL เมื่อคอมโพเนนต์ถูกทำลาย
  useEffect(() => {
    return () => {
      // ล้าง URL.createObjectURL เมื่อคอมโพเนนต์ถูกทำลาย
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ฟังก์ชันจัดการการเปลี่ยนรูปโปรไฟล์
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // หากมี URL ก่อนหน้า ให้ revoke เพื่อคืนหน่วยความจำ
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // ฟังก์ชันเมื่อคลิกที่รูปโปรไฟล์
  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  // ฟังก์ชันล้างรูปโปรไฟล์
  const handleClearImage = () => {
    // ถ้ามี URL ที่สร้างไว้ ให้ revoke เพื่อคืนหน่วยความจำ
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setProfileImage(null);
    setPreviewUrl(null);

    // รีเซ็ตค่าใน input element เพื่อให้สามารถเลือกไฟล์เดิมได้อีกครั้ง
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ฟังก์ชันเริ่มการแก้ไขข้อมูล
  const handleEditStart = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  // ฟังก์ชันยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setIsEditing(false);

    // ล้าง URL.createObjectURL ถ้ามีการเปลี่ยนรูปภาพแล้วยกเลิก
    if (profileImage && previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // ใช้ข้อมูลจาก API ที่เก็บไว้ใน userData
    if (userData) {
      setName(userData.name || "");
      setPreviewUrl(userData.image || null);
      setBio(userData.bio || "");
      setUseOriginalData(userData.use_original_data || false);
    }

    setProfileImage(null);
    setError("");
    setSuccess("");

    // ดึงข้อมูลจากฐานข้อมูลใหม่
    fetchUserProfile();
  };

  // ฟังก์ชันบันทึกข้อมูลที่แก้ไข
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อของคุณ");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("use_original_data", useOriginalData.toString());

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      console.log("ProfilePage: Saving profile data", {
        name,
        bio,
        useOriginalData,
        hasProfileImage: !!profileImage
      });

      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("ProfilePage: API error response", {
          status: response.status,
          text
        });
        throw new Error(`Error ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log("ProfilePage: Profile update response:", data);

      if (data.success) {
        // ล้าง URL.createObjectURL เมื่อบันทึกสำเร็จ
        if (profileImage && previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
          setProfileImage(null);
        }

        // อัพเดทเซสชัน
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            image: data.user.image
          }
        });

        // ตั้งค่า sessionStorage เพื่อบอกว่ามีการอัพเดท session
        sessionStorage.setItem('session_updated', 'true');

        setSuccess("อัพเดทข้อมูลสำเร็จ");
        setIsEditing(false);

        // อัพเดท userData
        setUserData(data.user);

        // อัพเดทข้อมูลในฟอร์ม
        setName(data.user.name);
        setPreviewUrl(data.user.image);
        setBio(data.user.bio || "");
        setUseOriginalData(data.user.use_original_data || false);

        // ดึงข้อมูลผู้ใช้ใหม่
        fetchUserProfile();
      } else {
        setError(data.message || "ไม่สามารถอัพเดทข้อมูลได้");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัพเดทข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันกลับไปใช้ข้อมูลจาก LINE
  const handleUseLineData = async () => {
    if (!originalLineData) return;

    setIsLoading(true);
    setError("");

    try {
      console.log("ProfilePage: Restoring LINE data");
      
      const response = await fetch('/api/user/use-line-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          use_original_data: true
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("ProfilePage: API error response", {
          status: response.status,
          text
        });
        throw new Error(`Error ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log("ProfilePage: LINE data restore response:", data);

      if (data.success) {
        // อัพเดทเซสชัน
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            image: data.user.image
          }
        });

        // ตั้งค่า sessionStorage เพื่อบอกว่ามีการอัพเดท session
        sessionStorage.setItem('session_updated', 'true');

        // อัพเดท userData
        setUserData(data.user);

        // อัพเดทข้อมูลในฟอร์ม
        setName(data.user.name);
        setPreviewUrl(data.user.image);
        setUseOriginalData(true);
        setSuccess("กลับไปใช้ข้อมูลจาก LINE เรียบร้อยแล้ว");

        // ดึงข้อมูลผู้ใช้ใหม่
        fetchUserProfile();

        // รีโหลดหน้าเพื่อแสดงการเปลี่ยนแปลงในทุกที่
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(data.message || "ไม่สามารถกลับไปใช้ข้อมูลจาก LINE ได้");
      }
    } catch (error) {
      console.error("Error using LINE data:", error);
      setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการกลับไปใช้ข้อมูลจาก LINE");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันจัดการเปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    fetchLoginHistory(page, viewMode);
  };

  // ฟังก์ชัน Logout จาก IP อื่น
  const handleLogoutIP = async (ipAddress: string, sessionId?: string) => {
    if (!ipAddress) return;

    setIsLoggingOut(ipAddress);
    try {
      console.log("ProfilePage: Logging out IP", ipAddress, "sessionId:", sessionId);
      
      const response = await fetch('/api/user/logout-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip_address: ipAddress,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("ProfilePage: API error response", {
          status: response.status,
          text
        });
        throw new Error(`Error ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log("ProfilePage: Logout IP response:", data);

      if (data.success) {
        // ดึงข้อมูลประวัติการเข้าสู่ระบบใหม่
        fetchLoginHistory(pagination.page, viewMode);

        // แสดงข้อความแจ้งสำเร็จ
        setSuccess(`ออกจากระบบ IP ${ipAddress} สำเร็จ`);
      } else {
        setError(data.message || "เกิดข้อผิดพลาดในการออกจากระบบ");
      }
    } catch (error) {
      console.error("Error logging out IP:", error);
      setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการออกจากระบบ");
    } finally {
      setIsLoggingOut(null);
    }
  };

  // ฟังก์ชันสำหรับรีเฟรชข้อมูล
  const handleRefreshData = () => {
    setNeedsRefresh(false);
    fetchUserProfile();
    fetchLoginHistory(pagination.page, viewMode);
  };

  // ฟังก์ชันล็อกเอาท์และตั้งค่า sessionStorage
  const handleLogout = async () => {
    // เก็บข้อมูลว่ามีการล็อกเอาท์ เพื่อไม่ให้ redirect กลับมาหน้า profile
    sessionStorage.setItem('logged_out', 'true');
    
    // ล้าง URL.createObjectURL ถ้ามี
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // ออกจากระบบและไปที่หน้า login
    router.replace('/login');
  };

  // แปลงสตริงวันที่เป็นรูปแบบไทย
  const formatThaiDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // แปลงชื่อ provider เป็นชื่อที่แสดงผล
  const formatProvider = (provider: string): string => {
    switch (provider) {
      case 'line':
        return 'LINE';
      case 'otp':
        return 'อีเมล OTP';
      default:
        // ถ้า session.user.id เริ่มต้นด้วย 'U' ให้สันนิษฐานว่าเป็น LINE
        if (session?.user?.id?.startsWith('U')) {
          return 'LINE';
        }
        return provider || 'ไม่ทราบ';
    }
  };

  // แสดงข้อความกำลังโหลด
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="primary" labelColor="primary" label="กำลังโหลด..." />
      </div>
    );
  }

  // ตรวจสอบว่าเป็นผู้ใช้ LINE หรือไม่
  const isLineUser = userData?.provider === 'line' || session?.user?.id?.startsWith('U');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">โปรไฟล์ของฉัน</h1>
          
          {needsRefresh && (
            <Button
              color="primary"
              variant="flat"
              size="sm"
              startContent={<FiRefreshCw />}
              onPress={handleRefreshData}
            >
              รีเฟรชข้อมูล
            </Button>
          )}
        </div>

        {/* การ์ดข้อมูลโปรไฟล์ */}
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">ข้อมูลส่วนตัว</h2>
            {!isEditing ? (
              <Button
                variant="flat"
                color="primary"
                size="sm"
                startContent={<FaRegEdit />}
                onPress={handleEditStart}
                isDisabled={isLoading}
              >
                แก้ไขข้อมูล
              </Button>
            ) : null}
          </CardHeader>

          <Divider />

          <CardBody>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            {isLoading && !isEditing ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" color="primary" />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                {/* รูปโปรไฟล์ */}
                <div className="flex flex-col items-center">
                  <div
                    className={`relative w-32 h-32 rounded-full mb-4 ${isEditing ? 'cursor-pointer' : ''} overflow-hidden bg-gray-200 flex items-center justify-center`}
                    onClick={handleImageClick}
                  >
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Profile"
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <FaUser size={50} className="text-gray-400" />
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <FaCamera size={28} className="text-white" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {isEditing && (
                    <div className="flex flex-col gap-2 items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        คลิกเพื่อเปลี่ยนรูปโปรไฟล์
                      </p>
                      {previewUrl && (
                        <Tooltip content="ลบรูปโปรไฟล์">
                          <Button
                            size="sm"
                            isIconOnly
                            color="danger"
                            variant="flat"
                            onPress={handleClearImage}
                          >
                            <FaTrashAlt size={16} />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  )}

                  {/* ปุ่มกลับไปใช้ข้อมูลจาก LINE */}
                  {!isEditing && isLineUser && originalLineData && !useOriginalData && (
                    <Tooltip content="กลับไปใช้ข้อมูลจาก LINE">
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<SiLine />}
                        onPress={handleUseLineData}
                        isLoading={isLoading}
                      >
                        ใช้ข้อมูล LINE
                      </Button>
                    </Tooltip>
                  )}
                </div>

                {/* ข้อมูลส่วนตัว */}
                <div className="flex-1">
                  {!isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ชื่อ</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-lg">{userData?.name || "ไม่ระบุ"}</p>
                          {isLineUser && useOriginalData && (
                            <Tooltip content="ใช้ชื่อจาก LINE">
                              <div className="flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                                <SiLine className="mr-1" /> LINE
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">อีเมล</h3>
                        <p className="text-lg">{userData?.email || ""}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">เข้าสู่ระบบด้วย</h3>
                        <p className="text-lg capitalize">{formatProvider(userData?.provider || "")}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">เกี่ยวกับฉัน</h3>
                        {userData?.bio ? (
                          <p className="text-lg">{userData.bio}</p>
                        ) : (
                          <p className="text-gray-400 italic">ยังไม่ได้เพิ่มข้อมูล</p>
                        )}
                      </div>

                      {/* แสดงข้อมูลต้นฉบับจาก LINE */}
                      {isLineUser && originalLineData && !useOriginalData && (
                        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                            <SiLine className="mr-2 text-green-500" /> ข้อมูลต้นฉบับจาก LINE
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400">ชื่อ:</p>
                              <p className="text-sm">{originalLineData.name}</p>
                            </div>
                            {originalLineData.profile_image && (
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">รูปโปรไฟล์:</p>
                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                  <Image
                                    src={originalLineData.profile_image}
                                    alt="LINE Profile"
                                    width={40}
                                    height={40}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* ปุ่มล็อกเอาท์ */}
                      <div className="mt-8">
                        <Button
                          color="danger"
                          variant="flat"
                          startContent={<FiLogOut />}
                          onPress={handleLogout}
                        >
                          ออกจากระบบ
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        type="text"
                        label="ชื่อ"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ชื่อของคุณ"
                        isRequired
                        variant="bordered"
                        endContent={
                          isLineUser && originalLineData && (
                            <Tooltip content="ใช้ชื่อจาก LINE">
                              <Button
                                size="sm"
                                isIconOnly
                                color="success"
                                variant="flat"
                                onPress={() => setName(originalLineData.name)}
                              >
                                <SiLine />
                              </Button>
                            </Tooltip>
                          )
                        }
                      />
                      <Input
                        type="email"
                        label="อีเมล"
                        value={userData?.email || ""}
                        isDisabled
                        variant="bordered"
                      />
                      <Textarea
                        label="เกี่ยวกับฉัน"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="ข้อมูลเกี่ยวกับตัวคุณ (ไม่บังคับ)"
                        variant="bordered"
                      />

                      {/* ตัวเลือกใช้ข้อมูลจาก LINE */}
                      {isLineUser && originalLineData && (
                        <div className="border border-green-200 rounded-lg p-3 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <SiLine className="text-green-500" size={18} />
                            <h3 className="text-sm font-medium">ข้อมูลจาก LINE</h3>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="useLineData"
                              checked={useOriginalData}
                              onChange={(e) => setUseOriginalData(e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor="useLineData" className="text-sm">
                              ใช้ข้อมูลต้นฉบับจาก LINE (ชื่อและรูปโปรไฟล์)
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            เมื่อเลือกตัวเลือกนี้ ข้อมูลจะอัพเดทอัตโนมัติทุกครั้งที่คุณเข้าสู่ระบบด้วย LINE
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          color="primary"
                          onPress={handleSaveProfile}
                          isLoading={isLoading}
                          startContent={<FaUserEdit />}
                        >
                          บันทึกข้อมูล
                        </Button>
                        <Button
                          variant="flat"
                          onPress={handleCancelEdit}
                          disabled={isLoading}
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* ประวัติการเข้าสู่ระบบ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FaHistory size={18} className="text-primary-color" />
              <h2 className="text-xl font-semibold">ประวัติการเข้าสู่ระบบล่าสุด</h2>
            </div>
          </CardHeader>

          <Divider />

          <CardBody>
            {isLoadingHistory ? (
              <div className="py-10 flex justify-center">
                <Spinner size="lg" color="primary" />
              </div>
            ) : (
              <>
                {/* Tabs สำหรับเลือกดูแบบจัดกลุ่มตาม IP หรือดูทั้งหมด */}
                <Tabs
                  aria-label="มุมมองประวัติการเข้าสู่ระบบ"
                  color="primary"
                  variant="underlined"
                  selectedKey={viewMode}
                  onSelectionChange={(key) => setViewMode(key as "grouped" | "all")}
                >
                  <Tab key="grouped" title="จัดกลุ่มตาม IP" />
                  <Tab key="all" title="ดูทั้งหมด" />
                </Tabs>

                {viewMode === "grouped" ? (
                  // มุมมองแบบจัดกลุ่มตาม IP
                  <>
                    {groupedHistory.length > 0 ? (
                      <div className="space-y-6 mt-4">
                        {groupedHistory.map((group) => (
                          <div
                            key={group._id}
                            className={`p-4 rounded-lg border ${group.is_current_ip ? 'border-primary-color bg-primary-color/5' : 'border-gray-200 dark:border-gray-700'
                              }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold">{group.ip_address}</h3>
                                  {group.is_current_ip && (
                                    <span className="bg-primary-color text-white text-xs px-2 py-1 rounded-full">
                                      อุปกรณ์ปัจจุบัน
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  จำนวนการเข้าสู่ระบบ: {group.count} ครั้ง |
                                  เข้าสู่ระบบล่าสุด: {formatThaiDate(group.lastLogin)}
                                </p>
                              </div>

                              {/* ปุ่ม Logout สำหรับ IP ที่ไม่ใช่ IP ปัจจุบัน */}
                              {!group.is_current_ip && (
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  startContent={<FiLogOut />}
                                  isLoading={isLoggingOut === group.ip_address}
                                  onPress={() => handleLogoutIP(group.ip_address, group.sessions[0]?.session_id)}
                                >
                                  ออกจากระบบ
                                </Button>
                              )}
                            </div>

                            {/* รายละเอียดเซสชัน (ซ่อนไว้และสามารถแสดงได้) */}
                            <Accordion>
                              <AccordionItem
                                key={`sessions-${group._id}`}
                                aria-label="ดูรายละเอียดเซสชัน"
                                title="ดูรายละเอียดเซสชัน"
                                classNames={{
                                  title: "text-sm",
                                  content: "py-0"
                                }}
                              >
                                <div className="max-h-64 overflow-y-auto pb-2">
                                  {group.sessions.map((session, index) => (
                                    <div
                                      key={session._id}
                                      className={`py-2 ${index < group.sessions.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                                        }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="text-sm">{formatThaiDate(session.login_time)}</p>
                                          <p className="text-xs text-gray-500 truncate max-w-sm">{session.user_agent}</p>
                                        </div>
                                        {session.is_current_session && (
                                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                            เซสชันปัจจุบัน
                                          </span>
                                        )}
                                        {session.session_logout_date && (
                                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                            ออกจากระบบแล้ว
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        ))}

                        {/* การแบ่งหน้า */}
                        {pagination.pages > 1 && (
                          <div className="mt-4 flex justify-center">
                            <Pagination
                              total={pagination.pages}
                              initialPage={1}
                              page={pagination.page}
                              onChange={handlePageChange}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-gray-500">ไม่พบประวัติการเข้าสู่ระบบ</div>
                    )}
                  </>
                ) : (
                  // มุมมองแบบรายการทั้งหมด
                  <>
                    {loginHistory.length > 0 ? (
                      <div className="overflow-auto mt-4">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                              <th className="py-2 px-4 text-left">วันเวลา</th>
                              <th className="py-2 px-4 text-left">IP Address</th>
                              <th className="py-2 px-4 text-left">อุปกรณ์</th>
                              <th className="py-2 px-4 text-left">สถานะ</th>
                              <th className="py-2 px-4 text-center">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loginHistory.map((item) => (
                              <tr key={item._id} className={`border-b border-gray-200 dark:border-gray-700 ${item.is_current_ip ? 'bg-primary-color/5' : ''
                                }`}>
                                <td className="py-3 px-4">{formatThaiDate(item.login_time)}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    {item.ip_address}
                                    {item.is_current_ip && (
                                      <span className="bg-primary-color text-white text-xs px-2 py-0.5 rounded-full">
                                        ปัจจุบัน
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 truncate max-w-xs">{item.user_agent}</td>
                                <td className="py-3 px-4">
                                  {item.session_logout_date ? (
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                      ออกจากระบบแล้ว
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                      ใช้งานอยู่
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {!item.session_logout_date && !item.is_current_ip && (
                                    <Button
                                      size="sm"
                                      color="danger"
                                      variant="flat"
                                      isIconOnly
                                      title="ออกจากระบบ"
                                      onPress={() => handleLogoutIP(item.ip_address, item.session_id)}
                                      isLoading={isLoggingOut === item.ip_address}
                                    >
                                      <FiLogOut size={16} />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* การแบ่งหน้า */}
                        {pagination.pages > 1 && (
                          <div className="mt-4 flex justify-center">
                            <Pagination
                              total={pagination.pages}
                              initialPage={1}
                              page={pagination.page}
                              onChange={handlePageChange}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-gray-500">ไม่พบประวัติการเข้าสู่ระบบ</div>
                    )}
                  </>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </main>

      <Footer />
    </div>
  );
}