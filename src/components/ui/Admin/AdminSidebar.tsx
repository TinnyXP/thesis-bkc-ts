"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button, Tooltip, Divider } from "@heroui/react";
import { signOut } from "next-auth/react";
import { 
  FaUserShield, 
  FaClipboardList, 
  FaComments, 
  FaUsers, 
  FaTachometerAlt, 
  FaDoorOpen, 
  FaBars,
  FaTimes,
  FaCog,
  FaExclamationTriangle
} from "react-icons/fa";
import { showToast } from "@/lib/toast";

interface AdminSidebarProps {
  isSuperAdmin: boolean;
}

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isMobile: boolean;
  adminOnly?: boolean;
  isSuperAdmin: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isSuperAdmin }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        isIconOnly
        color="default"
        variant="flat"
        className="fixed bottom-4 right-4 z-50 md:hidden shadow-md"
        onPress={toggleSidebar}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </Button>

      {/* Sidebar - Desktop */}
      <div className="w-64 bg-white dark:bg-zinc-900 border-r border-default-200 dark:border-default-100/20 h-screen sticky top-0 hidden md:block">
        <SidebarContent 
          pathname={pathname} 
          isSuperAdmin={isSuperAdmin}
          isMobile={false}
          onItemClick={() => {}} 
        />
      </div>

      {/* Sidebar - Mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeSidebar}>
          <div 
            className="w-64 bg-white dark:bg-zinc-900 h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent 
              pathname={pathname} 
              isSuperAdmin={isSuperAdmin}
              isMobile={true}
              onItemClick={closeSidebar} 
            />
          </div>
        </div>
      )}
    </>
  );
};

interface SidebarContentProps {
  pathname: string;
  isSuperAdmin: boolean;
  isMobile: boolean;
  onItemClick: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  pathname,
  isSuperAdmin,
  isMobile,
  onItemClick
}) => {
  const router = useRouter();

  const handleSignOut = async () => {
    showToast("กำลังออกจากระบบ...", "info");
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return (
    <div className="py-6 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 mb-6 flex items-center justify-center">
        <Link href="/" onClick={onItemClick}>
          <Image
            src="/Bkj_logo.svg"
            alt="บางกระเจ้า"
            width={120}
            height={60}
            className="mx-auto"
          />
        </Link>
      </div>

      <div className="px-4 mb-2">
        <h3 className="font-bold text-sm text-default-500 uppercase">ระบบจัดการ</h3>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2">
        <SidebarItem
          href="/admin"
          icon={<FaTachometerAlt />}
          label="แดชบอร์ด"
          isActive={pathname === "/admin"}
          isMobile={isMobile}
          isSuperAdmin={isSuperAdmin}
          onItemClick={onItemClick}
        />

        <SidebarItem
          href="/admin/complaints"
          icon={<FaClipboardList />}
          label="เรื่องร้องเรียน"
          isActive={pathname.startsWith("/admin/complaints")}
          isMobile={isMobile}
          isSuperAdmin={isSuperAdmin}
          onItemClick={onItemClick}
        />

        <SidebarItem
          href="/admin/forum"
          icon={<FaComments />}
          label="กระทู้"
          isActive={pathname.startsWith("/admin/forum")}
          isMobile={isMobile}
          isSuperAdmin={isSuperAdmin}
          onItemClick={onItemClick}
        />

        <SidebarItem
          href="/admin/users"
          icon={<FaUsers />}
          label="จัดการผู้ใช้"
          isActive={pathname === "/admin/users"}
          isMobile={isMobile}
          isSuperAdmin={isSuperAdmin}
          onItemClick={onItemClick}
        />

        {isSuperAdmin && (
          <>
            <Divider className="my-2" />
            <div className="px-4 mb-2">
              <h3 className="font-bold text-sm text-danger uppercase">Super Admin</h3>
            </div>

            <SidebarItem
              href="/admin/users/admins"
              icon={<FaUserShield />}
              label="จัดการผู้ดูแลระบบ"
              isActive={pathname === "/admin/users/admins"}
              isMobile={isMobile}
              adminOnly={true}
              isSuperAdmin={isSuperAdmin}
              onItemClick={onItemClick}
            />

            <SidebarItem
              href="/admin/settings"
              icon={<FaCog />}
              label="ตั้งค่าระบบ"
              isActive={pathname === "/admin/settings"}
              isMobile={isMobile}
              adminOnly={true}
              isSuperAdmin={isSuperAdmin}
              onItemClick={onItemClick}
            />

            <SidebarItem
              href="/admin/logs"
              icon={<FaExclamationTriangle />}
              label="บันทึกการทำงาน"
              isActive={pathname === "/admin/logs"}
              isMobile={isMobile}
              adminOnly={true}
              isSuperAdmin={isSuperAdmin}
              onItemClick={onItemClick}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 pt-4">
        <Divider className="mb-4" />
        <Button
          color="default"
          variant="flat"
          startContent={<FaDoorOpen />}
          className="w-full justify-start"
          onPress={handleSignOut}
        >
          ออกจากระบบ
        </Button>

        <div className="text-center mt-4">
          <Link 
            href="/"
            className="text-xs text-default-500 hover:text-primary-500"
            onClick={onItemClick}
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
};

interface SidebarItemWithClickProps extends SidebarItemProps {
  onItemClick: () => void;
}

const SidebarItem: React.FC<SidebarItemWithClickProps> = ({
  href,
  icon,
  label,
  isActive,
  isMobile,
  adminOnly,
  isSuperAdmin,
  onItemClick
}) => {
  // ถ้าเป็นเมนูสำหรับ admin เท่านั้น และผู้ใช้ไม่ใช่ admin ให้ไม่แสดงเมนูนี้
  if (adminOnly && !isSuperAdmin) {
    return null;
  }

  return (
    <Tooltip
      content={label}
      placement="right"
      isDisabled={isMobile}
    >
      <Link href={href} onClick={onItemClick}>
        <div
          className={`
            flex items-center px-4 py-3 rounded-lg my-1 transition-colors
            ${isActive 
              ? "bg-primary-500 text-white" 
              : "text-default-600 hover:bg-default-100 dark:hover:bg-default-800"
            }
          `}
        >
          <span className="mr-3">{icon}</span>
          <span>{label}</span>
        </div>
      </Link>
    </Tooltip>
  );
};