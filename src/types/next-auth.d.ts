import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * เพิ่มเติมฟิลด์ในออบเจ็กต์ Session
   */
  interface Session {
    user: {
      id: string;
      provider: string;
      isNewUser?: boolean;
    } & DefaultSession["user"];
  }

  /**
   * เพิ่มเติมฟิลด์ในออบเจ็กต์ User
   */
  interface User {
    provider?: string;
    provider_id?: string;
    isNewUser?: boolean;
  }
}

declare module "next-auth/jwt" {
  /**
   * เพิ่มเติมฟิลด์ใน JWT
   */
  interface JWT {
    userId: string;
    provider: string;
    isNewUser?: boolean;
  }
}