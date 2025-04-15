"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import React from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuItem, NavbarMenuToggle, Link, Button, Divider, useDisclosure } from "@heroui/react";
import { ToggleTheme, BookmarkModal, SettingsModal } from "@/components"
import { Dropdown, DropdownMenu, DropdownItem, DropdownTrigger, DropdownSection } from "@heroui/dropdown";
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

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ size = "sm" }) => {

  const { data: session } = useSession()

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
            src={session?.user?.image ?? "https://images.unsplash.com/broken"}
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
              <p className="font-semibold">{session?.user?.name ?? "Guest"}</p>
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
      />

      <BookmarkModal
        isOpen={isBookmarksOpen}
        onOpenChange={onBookmarksOpenChange}
      />
    </div>
  )
}