"use client"

import { HeroUIProvider } from "@heroui/react"
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react";
import { TranslationProvider } from '@/lib/i18n';

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
            {children}
            <ToastProvider />
          </TranslationProvider>
        </NextThemeProvider>
      </HeroUIProvider>
    </SessionProvider>
  )
}