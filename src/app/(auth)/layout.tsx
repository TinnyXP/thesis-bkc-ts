import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | บางกระเจ้า",
  description: "เข้าสู่ระบบด้วย LINE หรืออีเมล OTP",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-[family-name:var(--font-line-seed-sans)]">
      {children}
    </div>
  );
}