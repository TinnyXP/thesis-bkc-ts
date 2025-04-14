"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import React, { useEffect, useState, useCallback } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuItem, NavbarMenuToggle, Link, Button, Divider } from "@heroui/react";
import { ToggleTheme } from "@/components"
import { Dropdown, DropdownMenu, DropdownItem, DropdownTrigger, DropdownSection } from "@heroui/dropdown";
import { Avatar, AvatarIcon } from "@heroui/avatar";
import { FiArrowUpRight, FiLogIn, FiLogOut } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { LanguageSelectorButton, LanguageSelectorTab } from '@/lib/i18n';
import { useMockAuth } from '@/lib/auth/mockAuthContext';

export default function NavBar() {
  const { user, isAuthenticated, isLoading, logout } = useMockAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const { t } = useTranslation();
  const menuItems = [
    {
      label: t('history'),
      href: "/test/download"
    },
    {
      label: t('place'),
      href: "/test/download"
    },
    {
      label: t('news'),
      href: "/test/download"
    },
    {
      label: t('static'),
      href: "/test/download"
    },
  ];

  // ฟังก์ชัน Refresh Profile
  const handleRefreshProfile = useCallback(() => {
    setIsRefreshing(true);
    
    // จำลองการรีเฟรช
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  }, []);

  return (
    <Navbar
      height="60px"
      maxWidth="2xl"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      isBordered
      shouldHideOnScroll
      className="bg-white/90 dark:bg-black/90 shadow-sm backdrop-blur-md backdrop-saturate-150 font-[family-name:var(--font-line-seed-sans)]"
    >
      {/* Left Content */}
      <NavbarBrand>
        <Link href="/">
          <Image
            width={0}
            height={0}
            src="/Bkj_logo.svg"
            className="w-[80px] h-[40px]"
            alt="Website Logo"
          />
        </Link>
      </NavbarBrand>

      {/* Center Content */}
      <NavbarContent className="hidden md:flex gap-5" justify="center">
        {menuItems.map((item, index) => (
          <NavbarItem key={`${item}-${index}`}>
            <Link color="foreground" className="text-default-500 font-[family-name:var(--font-line-seed-sans)]" href={item.href} size="md">{item.label}</Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* Right Content */}
      <NavbarContent className="hidden md:flex" justify="end">
        <NavbarItem>
          {isAuthenticated && user && user.id ? (
            <div className="flex items-center gap-2">
              {isRefreshing && (
                <Button
                  isIconOnly
                  size="sm"
                  color="primary"
                  variant="flat"
                  isLoading={true}
                  title="รีเฟรชข้อมูลโปรไฟล์"
                >
                </Button>
              )}
              <ProfileAvatar
                isLoading={isLoading}
                size="md"
                user={user}
                logout={logout}
              />
            </div>
          ) : (
            <Button
              className="text-medium border-1.5 border-default-200 dark:border-default-200"
              color="default"
              variant="flat"
              endContent={<FiLogIn />}
              radius="full"
              as={Link}
              href="/login"
              size="md"
            >
              {t('login')}
            </Button>
          )}
        </NavbarItem>
        <Divider orientation="vertical" className="h-5" />
        <NavbarItem>
          <ToggleTheme className="border-1.5 border-default-200 dark:border-default-200" />
        </NavbarItem>
        <NavbarItem>
          <LanguageSelectorButton />
        </NavbarItem>
      </NavbarContent>

      {/* Right Content (NavBar Toggle) */}
      <NavbarContent className="flex md:hidden" justify="end">
        <NavbarItem>
          {isAuthenticated && user && user.id ? (
            <ProfileAvatar
              isLoading={isLoading}
              size="md"
              user={user}
              logout={logout}
            />
          ) : (
            <Button
              className="text-medium border-1.5 border-default-200 dark:border-default-200"
              color="default"
              variant="flat"
              endContent={<FiLogIn />}
              radius="full"
              as={Link}
              href="/login"
              size="md"
            >
              {t('login')}
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarMenuToggle className="text-default-400 md:hidden" />

      <NavbarMenu className="top-[calc(var(--navbar-height)_-_1px)] max-h-fit bg-white/90 py-5 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-black/90">
        <div className="grid grid-flow-col justify-stretch">
          {/* เมนูด้านซ้าย */}
          <div className="flex flex-col">
            {menuItems.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  color="foreground"
                  className="w-full font-[family-name:var(--font-line-seed-sans)]"
                  href={item.href}
                  size="md"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </div>

          {/* Divider ตรงกลาง */}
          <Divider orientation="vertical" />

          <div>
            <LanguageSelectorTab />
          </div>

          <Divider orientation="vertical" />

          {/* ToggleTheme ด้านขวา */}
          <div className="flex items-center">
            <NavbarMenuItem className="flex flex-col items-center">
              <ToggleTheme size="lg" iconSize={30} />
              <div className="flex flex-col items-center text-zinc-400 dark:text-zinc-400 mt-2">
                <p className="text-xs">ธีมปัจจุบัน</p>
                <p className="text-sm font-bold">{theme === "dark" ? "Dark" : "Light"}</p>
              </div>
            </NavbarMenuItem>
          </div>

        </div>

      </NavbarMenu>
    </Navbar>
  );
}

// แยกคอมโพเนนต์ ProfileAvatar ออกมา
interface ProfileAvatarProps {
  size?: "md" | "sm" | "lg";
  isLoading: boolean;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string;
  };
  logout: () => Promise<void>;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  size = "sm",
  isLoading,
  user,
  logout
}) => {
  // ฟังก์ชันล็อกเอาท์
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div>
      <Dropdown>
        <DropdownTrigger>
          <Avatar
            as="button"
            classNames={{
              base: "transition-transform bg-transparent border-1.5 border-default-200 dark:border-default-200",
              icon: "text-zinc-400 dark:text-zinc-400",
            }}
            size={size}
            src={user?.image ?? undefined}
            icon={<AvatarIcon />}
            showFallback
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="Profile Actions" variant="solid" className="font-[family-name:var(--font-line-seed-sans)]">
          <DropdownSection showDivider>
            <DropdownItem
              key="profile"
              className="h-14 gap-2"
            >
              <p className="font-regular text-default-500">
                ลงชื่อด้วย
              </p>
              <p className="font-semibold">{user?.name || "ผู้ใช้"}</p>
            </DropdownItem>
          </DropdownSection>
          <DropdownItem
            key="profile_page"
            as={Link}
            href="/profile"
            startContent={<FiArrowUpRight />}
          >
            จัดการโปรไฟล์
          </DropdownItem>
          <DropdownItem
            key="help_and_feedback"
            startContent={<FiArrowUpRight />}
          >ช่วยเหลือ & ฟีดแบ็ค
          </DropdownItem>
          <DropdownItem
            key="logout"
            color="danger"
            startContent={<FiLogOut />}
            onClick={handleLogout}
          >
            ออกจากระบบ
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};