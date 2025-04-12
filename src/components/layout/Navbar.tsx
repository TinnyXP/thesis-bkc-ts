"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import React, { useEffect, useState, useCallback } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuItem, NavbarMenuToggle, Link, Button, Divider } from "@heroui/react";
import { ToggleTheme } from "@/components"
import { Dropdown, DropdownMenu, DropdownItem, DropdownTrigger, DropdownSection } from "@heroui/dropdown";
import { Avatar, AvatarIcon } from "@heroui/avatar";
import { FiArrowUpRight, FiLogIn, FiLogOut, FiRefreshCw } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { LanguageSelectorButton, LanguageSelectorTab } from '@/lib/i18n';
import { signOut, useSession } from 'next-auth/react'

interface ProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string;
  provider: string;
  use_original_data: boolean;
  original_line_data?: {
    name: string;
    email: string;
    profile_image: string | null;
  };
}

export default function NavBar() {
  const { data: session, status, update } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

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

  // กำหนด fetchProfileData เป็น useCallback
  // เพิ่ม dependencies ที่จำเป็นให้ครบถ้วนใน useCallback
  // แก้ไขฟังก์ชัน fetchProfileData ให้ใช้ตัวแปร data ที่ได้รับมา

  const fetchProfileData = useCallback(async () => {
    if (!session?.user || !session.user.id || session.user.id === 'new-user' || session.user.isNewUser) {
      console.log("NavBar: Not fetching profile for new user or no session");
      return;
    }

    // ไม่ดึงข้อมูลซ้ำถ้ากำลังโหลดอยู่แล้ว
    if (isLoading) return;

    try {
      setIsLoading(true);
      console.log("NavBar: Fetching profile data for user ID:", session.user.id);

      const response = await fetch('/api/user/get-profile', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // ตรวจสอบสถานะการตอบกลับ
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching profile data:', response.status, errorText);

        // ถ้า status เป็น 401 (Unauthorized) แสดงว่า session อาจหมดอายุ
        if (response.status === 401) {
          console.log("NavBar: Session expired or invalid, user needs to login again");
          localStorage.removeItem('session_updated');
          sessionStorage.setItem('logged_out', 'true');
        }

        return;
      }

      const data = await response.json();
      console.log("NavBar: Profile data response:", data);

      if (data.success) {
        setProfileData(data.user);
        setNeedsRefresh(false);
        console.log("NavBar: Profile data set successfully:", data.user);

        // อัพเดท session ด้วยข้อมูลล่าสุดถ้ามีการเปลี่ยนแปลง
        if (data.user.name !== session.user.name || data.user.image !== session.user.image) {
          console.log("NavBar: Updating session with new profile data");
          await update({
            ...session,
            user: {
              ...session.user,
              name: data.user.name,
              image: data.user.image
            }
          });

          // อัพเดท sessionStorage เพื่อแจ้งคอมโพเนนต์อื่นๆ
          sessionStorage.setItem('session_updated', 'true');
        }
      } else {
        console.error("NavBar: Profile data error:", data.message);

        // ตรวจสอบข้อความ error เพื่อจัดการกับกรณีต่างๆ
        if (data.message?.includes("ไม่พบข้อมูลผู้ใช้") ||
          data.message?.includes("ไม่ได้รับอนุญาต")) {
          console.log("NavBar: User data not found or unauthorized");
          sessionStorage.setItem('logged_out', 'true');
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);

      // จัดการกับ error ต่างๆ เช่น การเชื่อมต่อล้มเหลว
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log("NavBar: Network error while fetching profile data");
      }
    } finally {
      setIsLoading(false);
    }
    // เพิ่ม update เข้าไปใน dependency array
  }, [session, isLoading, update]); // ลบ update ออกถ้าไม่จำเป็น หรือใช้ eslint-disable-line

  // ตรวจสอบ session เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    console.log("NavBar: Session changed", {
      status,
      userId: session?.user?.id,
      name: session?.user?.name,
      email: session?.user?.email
    });

    // ตรวจสอบว่ามีการอัพเดท session จาก sessionStorage หรือไม่
    const sessionUpdated = sessionStorage.getItem('session_updated');
    if (sessionUpdated === 'true') {
      console.log("NavBar: Session was updated, setting needsRefresh");
      setNeedsRefresh(true);
      sessionStorage.removeItem('session_updated');
    }

    // ถ้า authenticated และไม่ใช่ผู้ใช้ใหม่ ให้ดึงข้อมูลโปรไฟล์
    if (status === "authenticated" && session?.user &&
      session.user.id !== 'new-user' && !session.user.isNewUser) {
      fetchProfileData();
    } else {
      // รีเซ็ตข้อมูลโปรไฟล์เมื่อไม่มี session หรือเป็นผู้ใช้ใหม่
      setProfileData(null);
    }
  }, [session, status, fetchProfileData]);

  // ฟังก์ชันรีเฟรชข้อมูลโปรไฟล์
  const handleRefreshProfile = () => {
    fetchProfileData();
  };

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
          {session && status === "authenticated" && session.user && session.user.id && session.user.id !== 'new-user' && !session.user.isNewUser ? (
            <div className="flex items-center gap-2">
              {needsRefresh && (
                <Button
                  isIconOnly
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={handleRefreshProfile}
                  title="รีเฟรชข้อมูลโปรไฟล์"
                >
                  <FiRefreshCw />
                </Button>
              )}
              <ProfileAvatar
                isLoading={isLoading}
                size="md"
                session={session}
                profileData={profileData}
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
          {session && status === "authenticated" && session.user && session.user.id && session.user.id !== 'new-user' && !session.user.isNewUser ? (
            <ProfileAvatar
              isLoading={isLoading}
              size="md"
              session={session}
              profileData={profileData}
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
  session: {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
    }
  };
  profileData: ProfileData | null;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  size = "sm",
  isLoading,
  session,
  profileData
}) => {
  // ดึงรูปโปรไฟล์ที่ถูกต้อง
  const getProfileImage = () => {
    if (isLoading) return null;

    // ลำดับความสำคัญ: 1. profileData.image, 2. session.user.image
    if (profileData?.image) {
      return profileData.image;
    } else if (session?.user?.image) {
      return session.user.image;
    }

    return null;
  };

  // ดึงชื่อที่ถูกต้อง
  const getProfileName = () => {
    if (isLoading) return "กำลังโหลด...";

    // ลำดับความสำคัญ: 1. profileData.name, 2. session.user.name
    if (profileData?.name) {
      return profileData.name;
    } else if (session?.user?.name) {
      return session.user.name;
    }

    return "ผู้ใช้";
  };

  const profileImage = getProfileImage();
  const profileName = getProfileName();

  // ฟังก์ชันล็อกเอาท์
  const handleLogout = async () => {
    // เก็บข้อมูลว่ามีการล็อกเอาท์ เพื่อไม่ให้ redirect กลับมาหน้า profile
    sessionStorage.setItem('logged_out', 'true');

    // ล้าง localStorage เกี่ยวกับการเข้าสู่ระบบ
    localStorage.removeItem('loginEmail');
    localStorage.removeItem('otpSent');
    localStorage.removeItem('otpCountdown');
    localStorage.removeItem('otpTimestamp');
    localStorage.removeItem('firstLogin');

    // ออกจากระบบ
    await signOut({ callbackUrl: '/login' });
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
            src={profileImage ?? undefined}
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
              <p className="font-semibold">{profileName}</p>
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