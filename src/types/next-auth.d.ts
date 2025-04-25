// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * เพิ่มเติมฟิลด์ในออบเจ็กต์ Session
   */
  interface Session {
    user: {
      id: string;
      bkcId: string;  // ตรงนี้จะเป็น required
      provider: string;
      isNewUser?: boolean;
      isActive?: boolean;  // เพิ่มบรรทัดนี้
    } & DefaultSession["user"];
  }

  /**
   * เพิ่มเติมฟิลด์ในออบเจ็กต์ User
   */
  interface User {
    provider?: string;
    bkc_id: string;  // ตรงนี้ต้องเป็น required
    line_id?: string;
    isNewUser?: boolean;
    isActive?: boolean;  // เพิ่มบรรทัดนี้
  }
}

declare module "next-auth/jwt" {
  /**
   * เพิ่มเติมฟิลด์ใน JWT
   */
  interface JWT {
    userId: string;
    bkcId: string;  // ตรงนี้จะเป็น required
    provider: string;
    isNewUser?: boolean;
    isActive?: boolean;  // เพิ่มบรรทัดนี้
  }
}