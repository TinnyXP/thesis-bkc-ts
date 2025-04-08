"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardBody, CardHeader, Divider, Button, Input, Textarea, Tooltip } from "@heroui/react";
import { FaCamera, FaRegEdit, FaHistory, FaUser, FaUserEdit, FaTrashAlt } from "react-icons/fa";
import { SiLine } from "react-icons/si";
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

  // สถานะสำหรับประวัติการเข้าสู่ระบบ
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ใช้ useCallback สำหรับฟังก์ชัน fetchUserProfile
  const fetchUserProfile = useCallback(async () => {
    if (!session?.user?.id || session?.user?.id === "new-user") return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/get-profile');
      
      if (!response.ok) {
        console.error("Error fetching user profile:", response.statusText);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // เก็บข้อมูลผู้ใช้ที่ได้จาก API
        setUserData(data.user);
        
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
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
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
      // ดึงข้อมูลผู้ใช้จาก API
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

  // ฟังก์ชันล้างรูปโปรไฟล์
  const handleClearImage = () => {
    setProfileImage(null);
    setPreviewUrl(null);
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
      setError("เกิดข้อผิดพลาดในการอัพเดทข้อมูล");
    } finally {
      setIsLoading(false);
      
      // รีโหลดหน้าเพื่อแสดงการเปลี่ยนแปลงในทุกที่
      window.location.reload();
    }
  };

  // ฟังก์ชันกลับไปใช้ข้อมูลจาก LINE
  const handleUseLineData = async () => {
    if (!originalLineData) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/user/use-line-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          use_original_data: true
        })
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
      setError("เกิดข้อผิดพลาดในการกลับไปใช้ข้อมูลจาก LINE");
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
  if (status === "loading" || isLoading) {
    return <div className="flex justify-center items-center h-screen">กำลังโหลด...</div>;
  }

  // ตรวจสอบว่าเป็นผู้ใช้ LINE หรือไม่
  const isLineUser = userData?.provider === 'line' || session?.user?.id?.startsWith('U');

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
                {!isEditing && isLineUser && originalLineData && (
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