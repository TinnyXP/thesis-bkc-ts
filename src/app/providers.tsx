"use client"

import { HeroUIProvider } from "@heroui/react"
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react";
import { TranslationProvider } from '@/lib/i18n';
import { NavbarProvider } from '@/contexts/NavbarContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <NextThemeProvider
          attribute="class"
          defaultTheme="light"
          themes={["light", "dark"]}
        >
          <TranslationProvider>
            <NavbarProvider>
              {children}
              <ToastProvider />
            </NavbarProvider>
          </TranslationProvider>
        </NextThemeProvider>
      </HeroUIProvider>
    </SessionProvider>
  )
}