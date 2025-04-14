"use client"

import { HeroUIProvider } from "@heroui/react"
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { MockAuthProvider } from '@/lib/auth/mockAuthContext';
import { TranslationProvider } from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MockAuthProvider>
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
    </MockAuthProvider>
  )
}