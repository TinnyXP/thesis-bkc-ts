"use client"

import { HeroUIProvider } from "@heroui/react"
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { TranslationProvider } from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}