// src/components/layout/Navbar.tsx
"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Link,
  Button,
  Divider,
  useDisclosure,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownTrigger,
  DropdownSection,
  Spinner
} from "@heroui/react";
import { ToggleTheme, BookmarkModal, SettingsModal } from "@/components"

// เพิ่ม import useProfile กลับมา
import { useProfile } from "@/hooks/useProfile";

import { Avatar, AvatarIcon } from "@heroui/avatar";
import { FiBookmark, FiLogIn, FiLogOut, FiSettings } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { LanguageSelectorButton, LanguageSelectorTab } from '@/lib/i18n';
import { signOut, useSession } from 'next-auth/react'

interface ProfileAvatarProps {
  size?: "md" | "sm" | "lg";
}

export default function NavBar() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { t } = useTranslation();

  // ใช้ useMemo ครอบ menuItems เพื่อป้องกันการสร้างใหม่ทุกครั้งที่ render
  const menuItems = React.useMemo(() => [
    {
      label: t('history'),
      href: "/history"
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
  ], [t]); // ให้ dependency เป็น t เท่านั้น เพื่อให้สร้างใหม่เฉพาะเมื่อภาษาเปลี่ยน

  // เพิ่มข้อมูล schema.org สำหรับ navigation
  React.useEffect(() => {
    // สร้างและเพิ่ม script element สำหรับ schema.org สำหรับ navigation
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    
    const navigationData = {
      "@context": "https://schema.org",
      "@type": "SiteNavigationElement",
      "name": menuItems.map(item => item.label),
      "url": menuItems.map(item => {
        if (typeof window !== 'undefined') {
          return `${window.location.origin}${item.href}`;
        }
        return `https://www.bangkrachao.com${item.href}`;
      })
    };
    
    script.textContent = JSON.stringify(navigationData);
    document.head.appendChild(script);
    
    return () => {
      // Clean up
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, [menuItems]); // ตอนนี้ dependency จะดีขึ้นเพราะ menuItems ถูก memoize แล้ว

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
          {session ? (
            <ProfileAvatar size="md" />
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
          <LanguageSelectorButton /> {/* ใช้คอมโพเนนต์ใหม่ */}
        </NavbarItem>
      </NavbarContent>

      {/* Right Content (NavBar Toggle) */}
      <NavbarContent className="flex md:hidden" justify="end">
        <NavbarItem>
          {session ? (
            <ProfileAvatar size="md" />
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

// ในส่วน ProfileAvatar component ของ Navbar.tsx
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ size = "sm" }) => {
  const { data: session } = useSession();
  const { profile, isLoading, refreshProfile } = useProfile();

  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onOpenChange: onSettingsOpenChange
  } = useDisclosure();

  const {
    isOpen: isBookmarksOpen,
    onOpen: onBookmarksOpen,
    onOpenChange: onBookmarksOpenChange
  } = useDisclosure();

  // เพิ่ม state เพื่อเก็บข้อมูลโปรไฟล์ล่าสุด
  const [localProfile, setLocalProfile] = useState({
    name: profile?.name || session?.user?.name || "Guest",
    image: profile?.image || session?.user?.image
  });

  // อัปเดต localProfile เมื่อ profile หรือ session เปลี่ยน
  useEffect(() => {
    if (profile || session?.user) {
      setLocalProfile({
        name: profile?.name || session?.user?.name || "Guest",
        image: profile?.image || session?.user?.image
      });
    }
  }, [profile, session]);

  // เพิ่ม useEffect เพื่อรับฟังเหตุการณ์เมื่อมีการอัปเดตโปรไฟล์
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        // อัปเดตข้อมูลโปรไฟล์ในหน้านี้ทันที
        setLocalProfile({
          name: customEvent.detail.name || localProfile.name,
          image: customEvent.detail.image
        });
        
        // รีเฟรชข้อมูลโปรไฟล์จาก API
        refreshProfile();
      }
    };
    
    // ลงทะเบียนรับฟังเหตุการณ์
    window.addEventListener('profile-updated', handleProfileUpdated);
    
    // เมื่อถอดคอมโพเนนต์ออก ให้เลิกรับฟังเหตุการณ์
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [refreshProfile, localProfile.name]);

  // รีเฟรชข้อมูลเมื่อเปิด modal
  useEffect(() => {
    if (isSettingsOpen || isBookmarksOpen) {
      refreshProfile();
    }
  }, [isSettingsOpen, isBookmarksOpen, refreshProfile]);

  return (
    <div>
      <Dropdown>
        <DropdownTrigger>
          {isLoading ? (
            <Spinner size={size} />
          ) : (
            <Avatar
              as="button"
              classNames={{
                base: "transition-transform bg-transparent border-1.5 border-default-200 dark:border-default-200",
                icon: "text-zinc-400 dark:text-zinc-400",
              }}
              size={size}
              src={localProfile.image || undefined}
              icon={<AvatarIcon />}
              showFallback
            />
          )}
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
              <p className="font-semibold">{localProfile.name}</p>
            </DropdownItem>
          </DropdownSection>
          <DropdownItem
            key="bookmark"
            startContent={<FiBookmark />}
            onPress={onBookmarksOpen}
          >
            บุ๊คมาร์ค
          </DropdownItem>
          <DropdownItem
            key="settings"
            startContent={<FiSettings />}
            onPress={onSettingsOpen}
          >
            การตั้งค่า
          </DropdownItem>
          <DropdownItem
            key="logout"
            color="danger"
            startContent={<FiLogOut />}
            onPress={() => signOut()}
          >
            ออกจากระบบ
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <SettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={onSettingsOpenChange}
        userProfile={profile}
        refreshProfile={refreshProfile}
      />

      <BookmarkModal
        isOpen={isBookmarksOpen}
        onOpenChange={onBookmarksOpenChange}
      />
    </div>
  );
};