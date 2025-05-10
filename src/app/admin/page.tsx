"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip
} from "@heroui/react";
import { FaUserShield, FaClipboardList, FaComments, FaUsers, FaBell } from "react-icons/fa";
import { BiLineChart } from "react-icons/bi";
import { useAdmin } from "@/hooks/useAdmin";
import { Loading } from "@/components";
import { AdminSidebar } from "@/components";
import { showToast } from "@/lib/toast";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin, isSuperAdmin, isLoading } = useAdmin();

  // ตรวจสอบสิทธิ์การเข้าถึงหน้านี้
  useEffect(() => {
    if (status === "authenticated" && !isLoading) {
      if (!isAdmin) {
        showToast("คุณไม่มีสิทธิ์เข้าถึงหน้านี้", "error");
        router.push("/");
      }
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, isAdmin, isLoading, router]);

  if (status === "loading" || isLoading) {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-20">
            <FaUserShield size={50} className="text-danger mb-4" />
            <h2 className="text-2xl font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-default-500 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
            <Button color="primary" onPress={() => router.push("/")}>
              กลับไปยังหน้าหลัก
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar isSuperAdmin={isSuperAdmin} />
      
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="text-default-500">ยินดีต้อนรับ, {session?.user?.name}</p>
          
          {isSuperAdmin && (
            <Chip color="danger" variant="flat" className="mt-2">
              Super Admin
            </Chip>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <StatsCard 
            title="เรื่องร้องเรียน" 
            value="0" 
            description="รอดำเนินการ"
            icon={<FaClipboardList size={24} />}
            color="amber"
            onPress={() => router.push("/admin/complaints")}
          />
          
          <StatsCard 
            title="กระทู้" 
            value="0" 
            description="ใหม่วันนี้"
            icon={<FaComments size={24} />}
            color="blue"
            onPress={() => router.push("/admin/forum")}
          />
          
          <StatsCard 
            title="ผู้ใช้งาน" 
            value="0" 
            description="ทั้งหมด"
            icon={<FaUsers size={24} />}
            color="green"
            onPress={() => router.push("/admin/users")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">กิจกรรมล่าสุด</h2>
            </CardHeader>
            <CardBody>
              <div className="text-center py-10 text-default-500">
                <BiLineChart size={40} className="mx-auto mb-2" />
                <p>ยังไม่มีข้อมูลกิจกรรม</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">การแจ้งเตือน</h2>
            </CardHeader>
            <CardBody>
              <div className="text-center py-10 text-default-500">
                <FaBell size={40} className="mx-auto mb-2" />
                <p>ไม่มีการแจ้งเตือนใหม่</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: "amber" | "blue" | "green" | "purple" | "red";
  onPress?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  color,
  onPress
}) => {
  const colorClasses = {
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
  };

  return (
    <Card 
      isPressable={!!onPress} 
      onPress={onPress}
      shadow="sm"
      className="border border-default-200 dark:border-default-100/20"
    >
      <CardBody>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-1">{value}</h3>
            <p className="text-default-500 text-sm">{title}</p>
            <p className="text-xs mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};