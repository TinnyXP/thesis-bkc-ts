"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card, CardBody, CardHeader, CardFooter,
  Button, Input, Textarea, Spinner,
  Divider, Avatar, AvatarIcon,
  Tabs, Tab, Badge, Switch,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Tooltip, Pagination
} from "@heroui/react";
import { NavBar, Footer } from "@/components";
import { useMockAuth } from "@/lib/auth/mockAuthContext";
import { useMockProfileImage } from "@/lib/hooks/useMockProfileImage";
import { useMockLoginHistory } from "@/lib/hooks/useMockLoginHistory";
import { motion } from "framer-motion";

// Icons
import {
  FaUser, FaCamera, FaHistory, FaShieldAlt,
  FaEdit, FaTrash, FaSave, FaTimes, FaInfoCircle,
  FaSync, FaExclamationTriangle
} from "react-icons/fa";
import { SiLine } from "react-icons/si";
import { MdEmail, MdSecurity, MdDevices } from "react-icons/md";
import { IoMdRefresh } from "react-icons/io";
import { HiOutlineExternalLink } from "react-icons/hi";
import { BiLogOut } from "react-icons/bi";

export default function ProfilePage() {
  const router = useRouter();

  // Mock hooks
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    updateProfile,
    toggleLineData,
    logout
  } = useMockAuth();

  // Profile image hook
  const {
    imageFile,
    previewUrl,
    fileInputRef,
    openFileDialog,
    handleFileChange,
    clearImage,
    resetToInitial,
    isLoading: isImageLoading
  } = useMockProfileImage(user?.image || null);

  // Login history hook
  const {
    history,
    currentIp,
    isLoading: isHistoryLoading,
    viewMode,
    pagination,
    page,
    logoutSession,
    handlePageChange,
    changeViewMode,
    isLoggingOut,
    refetch: refetchHistory
  } = useMockLoginHistory();

  // Local state
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const { isOpen: isLogoutModalOpen, onOpen: onLogoutModalOpen, onClose: onLogoutModalClose } = useDisclosure();
  const { isOpen: isSuccessModalOpen, onOpen: onSuccessModalOpen, onClose: onSuccessModalClose } = useDisclosure();

  // Toast/notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    visible: boolean;
  } | null>(null);

  // Effect to check auth state and redirect if needed
  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      router.replace("/login");
    }

    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
    }
  }, [isAuthenticated, isAuthLoading, router, user]);

  // Effect to show errors from auth system
  useEffect(() => {
    if (authError) {
      setError(authError);
      setNotification({
        type: 'error',
        message: authError,
        visible: true
      });

      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [authError]);

  // Handle refresh of profile data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    setSuccess(null);

    try {
      await refetchHistory();

      setNotification({
        type: 'success',
        message: 'ข้อมูลอัพเดทเรียบร้อยแล้ว',
        visible: true
      });

      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      setError('ไม่สามารถรีเฟรชข้อมูลได้');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle edit mode toggle
  const handleEditStart = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setError(null);
    resetToInitial();

    if (user) {
      setName(user.name);
      setBio(user.bio || "");
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อของคุณ");
      return;
    }

    setError(null);

    try {
      const result = await updateProfile({
        name,
        bio,
        profileImage: imageFile
      });

      if (result.success) {
        setSuccess("อัพเดทข้อมูลสำเร็จ");
        setIsEditing(false);
        onSuccessModalOpen();
      } else {
        setError(result.error || "ไม่สามารถอัพเดทข้อมูลได้");
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  // Handle LINE data usage
  const handleToggleLineData = async (useIt: boolean) => {
    if (!user?.provider || user.provider !== 'line') return;

    try {
      await toggleLineData(useIt);

      setNotification({
        type: 'success',
        message: useIt ? 'กลับไปใช้ข้อมูลจาก LINE แล้ว' : 'เปลี่ยนไปใช้ข้อมูลที่กำหนดเองแล้ว',
        visible: true
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      setError("ไม่สามารถเปลี่ยนข้อมูล LINE ได้");
    }
  };

  // Handle logout from current session
  const handleLogout = async () => {
    onLogoutModalClose();
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setError("ไม่สามารถออกจากระบบได้");
    }
  };

  // Handle logout from other sessions/devices
  const handleLogoutOtherDevice = async (ipAddress: string, sessionId?: string) => {
    try {
      await logoutSession(ipAddress, sessionId);

      setNotification({
        type: 'success',
        message: `ออกจากระบบ IP ${ipAddress} สำเร็จ`,
        visible: true
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      setError("ไม่สามารถออกจากระบบได้");
    }
  };

  // Format date for display
  const formatThaiDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (isAuthLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  // Check if user is a LINE user
  const isLineUser = user?.provider === 'line';
  const useOriginalLineData = isLineUser && user?.useOriginalLineData;
  const originalLineData = isLineUser ? user?.originalLineData : null;

  // Notification component
  const NotificationBox = () => {
    if (!notification?.visible) return null;

    const bgColor =
      notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 border-green-400 dark:border-green-800 text-green-700 dark:text-green-300' :
        notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/20 border-red-400 dark:border-red-800 text-red-700 dark:text-red-300' :
          'bg-blue-100 dark:bg-blue-900/20 border-blue-400 dark:border-blue-800 text-blue-700 dark:text-blue-300';

    return (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border ${bgColor} max-w-md`}
      >
        <div className="flex items-start">
          {notification.type === 'success' && <FaSave className="mr-3 mt-1" />}
          {notification.type === 'error' && <FaExclamationTriangle className="mr-3 mt-1" />}
          {notification.type === 'info' && <FaInfoCircle className="mr-3 mt-1" />}
          <div>
            <p>{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />

      {/* Notification */}
      <NotificationBox />

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar - User info summary */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <Card className="mb-6">
              <CardBody className="pt-8 pb-5 flex flex-col items-center text-center">
                {/* Profile Image */}
                <div className="relative mb-4">
                  <Avatar
                    size="lg"
                    src={previewUrl || undefined}
                    icon={<AvatarIcon />}
                    className="w-24 h-24 text-large"
                    isBordered
                    color={isLineUser && useOriginalLineData ? "success" : "default"}
                  />
                  {isLineUser && useOriginalLineData && (
                    <Badge color="success"
                      placement="bottom-right"
                      className="border-2 border-white dark:border-gray-900"
                    >
                      <SiLine />
                    </Badge>
                  )}
                </div>

                {/* User Info */}
                <h2 className="text-xl font-bold mb-1">{user?.name}</h2>
                <div className="flex items-center justify-center mb-3">
                  <MdEmail className="mr-1 text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>

                {/* Login Type Badge */}
                <div className="mb-4">
                  <Badge
                    color={isLineUser ? "success" : "primary"}
                    variant="flat"
                    className="px-3 py-1"
                  >
                    {isLineUser ? (
                      <div className="flex items-center gap-1">
                        <SiLine />
                        <span>LINE</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <MdEmail />
                        <span>OTP</span>
                      </div>
                    )}
                  </Badge>
                </div>

                {/* Bio */}
                <div className="w-full mb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mx-4">
                    {user?.bio || (
                      <span className="text-gray-500 italic">ยังไม่มีข้อมูลเกี่ยวกับตัวคุณ</span>
                    )}
                  </p>
                </div>

                {/* Edit/Refresh Buttons */}
                <div className="flex gap-2 w-full px-4">
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<FaEdit />}
                    fullWidth
                    onPress={handleEditStart}
                    isDisabled={isEditing}
                  >
                    แก้ไขโปรไฟล์
                  </Button>
                  <Button
                    color="default"
                    variant="light"
                    isIconOnly
                    onPress={handleRefresh}
                    isLoading={isRefreshing}
                  >
                    <IoMdRefresh />
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Security Options */}
            <Card className="mb-6">
              <CardHeader className="pb-0">
                <h3 className="text-lg font-semibold flex items-center">
                  <FaShieldAlt className="mr-2 text-primary-color" />
                  ความปลอดภัย
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {/* LINE Data Option */}
                  {isLineUser && originalLineData && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <SiLine className="mr-2 text-green-500" />
                          <span className="text-sm">ใช้ข้อมูลจาก LINE</span>
                        </div>
                        <Switch
                          size="sm"
                          isSelected={useOriginalLineData}
                          onValueChange={handleToggleLineData}
                          color="success"
                        />
                      </div>
                      <p className="text-xs text-gray-500 pl-6">
                        ใช้ชื่อและรูปโปรไฟล์จาก LINE
                      </p>
                    </div>
                  )}

                  {/* Devices */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MdDevices className="mr-2 text-blue-500" />
                      <span className="text-sm">จัดการอุปกรณ์</span>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => setActiveTab("devices")}
                    >
                      <HiOutlineExternalLink size={16} />
                    </Button>
                  </div>

                  {/* Logout Option */}
                  <div className="pt-2">
                    <Button
                      color="danger"
                      variant="flat"
                      startContent={<BiLogOut />}
                      fullWidth
                      onPress={onLogoutModalOpen}
                    >
                      ออกจากระบบ
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main content */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <Card className="mb-6">
              <CardHeader className="pb-0">
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={setActiveTab as any}
                  variant="underlined"
                  color="primary"
                  classNames={{
                    tabList: "gap-6 w-full relative rounded-none p-0",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-primary"
                  }}
                >
                  <Tab
                    key="profile"
                    title={
                      <div className="flex items-center gap-2">
                        <FaUser />
                        <span>โปรไฟล์</span>
                      </div>
                    }
                  />
                  <Tab
                    key="devices"
                    title={
                      <div className="flex items-center gap-2">
                        <FaHistory />
                        <span>อุปกรณ์ที่ใช้งาน</span>
                      </div>
                    }
                  />
                </Tabs>
              </CardHeader>

              <CardBody>
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="py-4">
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Profile Image Editor */}
                          <div className="flex flex-col items-center md:w-1/3">
                            <div
                              className="relative w-40 h-40 rounded-full mb-3 cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-solid border-default-200 dark:border-default-700"
                              onClick={openFileDialog}
                            >
                              {previewUrl ? (
                                <Image
                                  src={previewUrl}
                                  alt="Profile preview"
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <FaUser size={60} className="text-gray-400" />
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <FaCamera size={36} className="text-white" />
                              </div>
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={openFileDialog}
                              >
                                เปลี่ยนรูป
                              </Button>
                              {previewUrl && (
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  onPress={clearImage}
                                >
                                  ลบรูป
                                </Button>
                              )}
                            </div>

                            {/* LINE Data Note */}
                            {isLineUser && originalLineData && (
                              <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                <p>คุณสามารถเลือกใช้ข้อมูลและรูปโปรไฟล์จาก LINE ได้ในแถบความปลอดภัย</p>
                              </div>
                            )}
                          </div>

                          {/* Profile Form */}
                          <div className="flex-1 space-y-4">
                            <Input
                              type="text"
                              label="ชื่อของคุณ"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="กรอกชื่อที่ต้องการแสดง"
                              isRequired
                              variant="bordered"
                              errorMessage={!name.trim() ? "กรุณากรอกชื่อของคุณ" : ""}
                              description="ชื่อนี้จะแสดงในหน้าโปรไฟล์และการโพสต์ของคุณ"
                              startContent={<FaUser className="text-default-400" />}
                            />

                            <Input
                              type="email"
                              label="อีเมล"
                              value={user?.email || ""}
                              isDisabled
                              variant="bordered"
                              description="อีเมลนี้ใช้สำหรับการเข้าสู่ระบบและไม่สามารถเปลี่ยนแปลงได้"
                              startContent={<MdEmail className="text-default-400" />}
                            />

                            <Textarea
                              label="เกี่ยวกับฉัน"
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              placeholder="เล่าเกี่ยวกับตัวคุณสักเล็กน้อย (ไม่บังคับ)"
                              variant="bordered"
                              minRows={4}
                              description="ข้อมูลนี้จะแสดงในหน้าโปรไฟล์ของคุณ"
                            />

                            <div className="flex gap-2 justify-end pt-4">
                              <Button
                                color="primary"
                                onPress={handleSaveProfile}
                                startContent={<FaSave />}
                              >
                                บันทึกข้อมูล
                              </Button>
                              <Button
                                variant="flat"
                                onPress={handleEditCancel}
                                startContent={<FaTimes />}
                              >
                                ยกเลิก
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">ชื่อ</h3>
                              <p className="text-lg">{user?.name}</p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">อีเมล</h3>
                              <p className="text-lg">{user?.email}</p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">เข้าสู่ระบบด้วย</h3>
                              <div className="flex items-center">
                                {isLineUser ? (
                                  <>
                                    <SiLine className="mr-2 text-green-500" />
                                    <span>LINE</span>

                                    {useOriginalLineData && (
                                      <Badge color="success" variant="flat" className="ml-2">
                                        ใช้ข้อมูลจาก LINE
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <MdEmail className="mr-2 text-blue-500" />
                                    <span>OTP</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">เกี่ยวกับฉัน</h3>
                              {user?.bio ? (
                                <p className="text-lg">{user.bio}</p>
                              ) : (
                                <p className="text-gray-400 dark:text-gray-500 italic">ยังไม่ได้เพิ่มข้อมูล</p>
                              )}
                            </div>

                            {/* LINE Original Data Display */}
                            {isLineUser && originalLineData && !useOriginalLineData && (
                              <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                                  <SiLine className="mr-2 text-green-500" /> ข้อมูลต้นฉบับจาก LINE
                                </h3>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">ชื่อ:</p>
                                    <p className="text-sm">{originalLineData.name}</p>
                                  </div>
                                  {originalLineData.profileImage && (
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-gray-500 dark:text-gray-400">รูปโปรไฟล์:</p>
                                      <div className="w-10 h-10 rounded-full overflow-hidden">
                                        <Image
                                          src={originalLineData.profileImage}
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
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Devices/Sessions Tab */}
                {activeTab === "devices" && (
                  <div className="py-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">อุปกรณ์ที่ใช้งานอยู่</h3>

                      <div className="flex gap-2">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              variant="flat"
                              size="sm"
                            >
                              {viewMode === "grouped" ? "จัดกลุ่มตาม IP" : "แสดงทั้งหมด"}
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="มุมมองการแสดงผล"
                            onAction={(key) => changeViewMode(key as "grouped" | "all")}
                          >
                            <DropdownItem key="grouped">จัดกลุ่มตาม IP</DropdownItem>
                            <DropdownItem key="all">แสดงทั้งหมด</DropdownItem>
                          </DropdownMenu>
                        </Dropdown>

                        <Button
                          size="sm"
                          variant="flat"
                          isIconOnly
                          onPress={() => refetchHistory()}
                          isLoading={isHistoryLoading}
                        >
                          <IoMdRefresh />
                        </Button>
                      </div>
                    </div>

                    {isHistoryLoading ? (
                      <div className="py-10 flex justify-center">
                        <Spinner size="lg" color="primary" />
                      </div>
                    ) : (
                      <>
                        {/* Sessions List */}
                        <div className="space-y-4">
                          {viewMode === "grouped" ? (
                            // Grouped by IP view
                            <>
                              {history.length > 0 ? (
                                history.map((group: any) => (
                                  <Card
                                    key={group._id}
                                    className={`${group.is_current_ip ? 'border-2 border-primary-color' : 'border'}`}
                                    shadow="sm"
                                  >
                                    <CardBody className="p-4">
                                      <div className="flex justify-between">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="text-base font-medium">{group.ip_address}</h4>
                                            {group.is_current_ip && (
                                              <Badge color="primary" variant="flat">
                                                อุปกรณ์ปัจจุบัน
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">
                                            การเข้าสู่ระบบ: {group.count} ครั้ง |
                                            ล่าสุด: {formatThaiDate(group.lastLogin)}
                                          </p>
                                        </div>

                                        {!group.is_current_ip && (
                                          <Button
                                            size="sm"
                                            color="danger"
                                            variant="flat"
                                            startContent={<BiLogOut />}
                                            isLoading={isLoggingOut}
                                            onPress={() => handleLogoutOtherDevice(group.ip_address, group.sessions[0]?.session_id)}
                                          >
                                            ออกจากระบบ
                                          </Button>
                                        )}
                                      </div>

                                      <Divider className="my-3" />

                                      <div className="max-h-60 overflow-y-auto">
                                        <div className="space-y-3">
                                          {group.sessions.map((session: any) => (
                                            <div key={session._id} className="flex justify-between items-center">
                                              <div>
                                                <p className="text-sm">{formatThaiDate(session.login_time)}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                  {session.user_agent}
                                                </p>
                                              </div>
                                              {session.is_current_session ? (
                                                <Badge color="success">
                                                  เซสชันปัจจุบัน
                                                </Badge>
                                              ) : session.session_logout_date ? (
                                                <Badge color="default" variant="flat">
                                                  ออกจากระบบแล้ว
                                                </Badge>
                                              ) : null}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </CardBody>
                                  </Card>
                                ))
                              ) : (
                                <div className="text-center py-10">
                                  <p className="text-gray-500 dark:text-gray-400">ไม่พบประวัติการเข้าสู่ระบบ</p>
                                </div>
                              )}
                            </>
                          ) : (
                            // All sessions view
                            <>
                              {history.length > 0 ? (
                                <Card shadow="sm">
                                  <CardBody className="p-0">
                                    <table className="min-w-full">
                                      <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800">
                                          <th className="py-2 px-4 text-left text-sm font-medium">วันเวลา</th>
                                          <th className="py-2 px-4 text-left text-sm font-medium">IP Address</th>
                                          <th className="py-2 px-4 text-left text-sm font-medium">อุปกรณ์</th>
                                          <th className="py-2 px-4 text-left text-sm font-medium">สถานะ</th>
                                          <th className="py-2 px-4 text-center text-sm font-medium">จัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {history.map((item: any) => (
                                          <tr
                                            key={item.id}
                                            className={`border-b border-gray-200 dark:border-gray-700 ${item.isCurrentIp ? 'bg-primary-color/5' : ''
                                              }`}
                                          >
                                            <td className="py-3 px-4 text-sm">{formatThaiDate(item.loginTime)}</td>
                                            <td className="py-3 px-4 text-sm">
                                              <div className="flex items-center gap-2">
                                                {item.ipAddress}
                                                {item.isCurrentIp && (
                                                  <Badge color="primary" variant="flat" size="sm">
                                                    ปัจจุบัน
                                                  </Badge>
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm truncate max-w-xs">{item.userAgent}</td>
                                            <td className="py-3 px-4 text-sm">
                                              {item.logoutDate ? (
                                                <Badge color="default" variant="flat" size="sm">
                                                  ออกจากระบบแล้ว
                                                </Badge>
                                              ) : (
                                                <Badge color="success" variant="flat" size="sm">
                                                  ใช้งานอยู่
                                                </Badge>
                                              )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                              {!item.logoutDate && !item.isCurrentIp && (
                                                <Button
                                                  size="sm"
                                                  color="danger"
                                                  variant="flat"
                                                  isIconOnly
                                                  onPress={() => handleLogoutOtherDevice(item.ipAddress, item.sessionId)}
                                                  isLoading={isLoggingOut}
                                                >
                                                  <BiLogOut size={16} />
                                                </Button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </CardBody>
                                </Card>
                              ) : (
                                <div className="text-center py-10">
                                  <p className="text-gray-500 dark:text-gray-400">ไม่พบประวัติการเข้าสู่ระบบ</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                          <div className="flex justify-center mt-6">
                            <Pagination
                              total={pagination.pages}
                              initialPage={1}
                              page={page}
                              onChange={handlePageChange}
                              classNames={{
                                cursor: "bg-primary text-white font-medium",
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </main>

      {/* Logout Modal */}
      <Modal isOpen={isLogoutModalOpen} onClose={onLogoutModalClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">ออกจากระบบ</ModalHeader>
              <ModalBody>
                <p>คุณต้องการออกจากระบบใช่หรือไม่?</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อเข้าถึงบัญชีของคุณ
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button color="danger" onPress={handleLogout}>
                  ออกจากระบบ
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={isSuccessModalOpen} onClose={onSuccessModalClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center text-green-600">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-green-100 p-3">
                    <FaSave size={24} className="text-green-600" />
                  </div>
                </div>
                บันทึกข้อมูลสำเร็จ
              </ModalHeader>
              <ModalBody className="text-center">
                <p>ข้อมูลโปรไฟล์ของคุณถูกบันทึกเรียบร้อยแล้ว</p>
              </ModalBody>
              <ModalFooter className="justify-center">
                <Button color="primary" onPress={onClose} variant="light">
                  ตกลง
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Footer />
    </div>
  );
}