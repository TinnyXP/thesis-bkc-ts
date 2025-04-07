"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardBody, CardHeader, Divider, Button, Input, Textarea } from "@heroui/react";
import { FaCamera, FaRegEdit, FaHistory, FaUser, FaUserEdit } from "react-icons/fa";
import { NavBar, Footer } from "@/components";

// อินเตอร์เฟซสำหรับประวัติการเข้าสู่ระบบ
interface LoginHistoryItem {
  _id: string;
  login_time: string;
  ip_address: string;
  user_agent: string;
  device_info?: string;
  location?: string;
}

// อินเตอร์เฟซสำหรับข้อมูลผู้ใช้จาก API
// interface UserProfile {
//   id: string;
//   name: string;
//   email: string;
//   image: string | null;
//   bio: string;
//   provider: string;
// }

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // สถานะสำหรับการแก้ไขข้อมูล
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [provider, setProvider] = useState<string>(""); // เพิ่มสถานะสำหรับ provider
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // สถานะสำหรับประวัติการเข้าสู่ระบบ
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ใช้ useCallback สำหรับฟังก์ชัน fetchUserProfile
  const fetchUserProfile = useCallback(async () => {
    if (!session?.user?.id || session?.user?.id === "new-user") return;
    
    try {
      const response = await fetch('/api/user/get-profile');
      
      if (!response.ok) {
        console.error("Error fetching user profile:", response.statusText);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // อัพเดทข้อมูลในฟอร์ม
        setName(data.user.name || "");
        setBio(data.user.bio || "");
        setProvider(data.user.provider || "unknown"); // ตั้งค่า provider จาก API
        
        if (data.user.image) {
          setPreviewUrl(data.user.image);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, [session?.user?.id]);

  // ใช้ useCallback สำหรับฟังก์ชัน fetchLoginHistory
  const fetchLoginHistory = useCallback(async () => {
    if (!session?.user?.id || session?.user?.id === "new-user") return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/user/login-history?limit=5`);
      
      if (!response.ok) {
        console.error("Error fetching login history:", response.statusText);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLoginHistory(data.history);
      } else {
        console.error("Failed to fetch login history:", data.message);
      }
    } catch (error) {
      console.error("Error fetching login history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [session?.user?.id]);
  
  // เมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    // ตรวจสอบว่ามีการล็อกอินหรือไม่
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    
    // ถ้าเป็นผู้ใช้ใหม่ให้ไปยังหน้าสร้างโปรไฟล์
    if (status === "authenticated" && session?.user?.isNewUser) {
      router.replace("/complete-profile");
      return;
    }

    // ตั้งค่าข้อมูลเริ่มต้นเมื่อมีข้อมูล session
    if (status === "authenticated" && session?.user) {
      setName(session.user.name || "");
      setPreviewUrl(session.user.image || null);
      
      // ดึงข้อมูลผู้ใช้เพิ่มเติม (เช่น bio และ provider) จาก API
      fetchUserProfile();
      
      // ดึงข้อมูลประวัติการเข้าสู่ระบบ
      fetchLoginHistory();
    }
  }, [session, status, router, fetchUserProfile, fetchLoginHistory]);

  // ฟังก์ชันจัดการการเปลี่ยนรูปโปรไฟล์
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
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

  // ฟังก์ชันเริ่มการแก้ไขข้อมูล
  const handleEditStart = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  // ฟังก์ชันยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setIsEditing(false);
    setName(session?.user?.name || "");
    setPreviewUrl(session?.user?.image || null);
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
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

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
        
        setSuccess("อัพเดทข้อมูลสำเร็จ");
        setIsEditing(false);
        
        // อัพเดทข้อมูลในหน้า
        setName(data.user.name);
        setPreviewUrl(data.user.image);
        setBio(data.user.bio || "");
        
        // ดึงข้อมูลผู้ใช้ใหม่
        fetchUserProfile();
      } else {
        setError(data.message || "ไม่สามารถอัพเดทข้อมูลได้");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("เกิดข้อผิดพลาดในการอัพเดทข้อมูล");
    } finally {
      setIsLoading(false);
    }
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
    return <div className="flex justify-center items-center h-screen">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">โปรไฟล์ของฉัน</h1>

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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    คลิกเพื่อเปลี่ยนรูปโปรไฟล์
                  </p>
                )}
              </div>
              
              {/* ข้อมูลส่วนตัว */}
              <div className="flex-1">
                {!isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ชื่อ</h3>
                      <p className="text-lg">{session?.user?.name || "ไม่ระบุ"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">อีเมล</h3>
                      <p className="text-lg">{session?.user?.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">เข้าสู่ระบบด้วย</h3>
                      <p className="text-lg capitalize">{formatProvider(provider)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">เกี่ยวกับฉัน</h3>
                      {bio ? (
                        <p className="text-lg">{bio}</p>
                      ) : (
                        <p className="text-gray-400 italic">ยังไม่ได้เพิ่มข้อมูล</p>
                      )}
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
                    />
                    <Input
                      type="email"
                      label="อีเมล"
                      value={session?.user?.email || ""}
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
              <div className="py-4 text-center">กำลังโหลดข้อมูล...</div>
            ) : loginHistory.length > 0 ? (
              <div className="overflow-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="py-2 px-4 text-left">วันเวลา</th>
                      <th className="py-2 px-4 text-left">IP Address</th>
                      <th className="py-2 px-4 text-left">อุปกรณ์</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((item) => (
                      <tr key={item._id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3 px-4">{formatThaiDate(item.login_time)}</td>
                        <td className="py-3 px-4">{item.ip_address}</td>
                        <td className="py-3 px-4 truncate max-w-xs">{item.user_agent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">ไม่พบประวัติการเข้าสู่ระบบ</div>
            )}
          </CardBody>
        </Card>
      </main>

      <Footer />
    </div>
  );
}