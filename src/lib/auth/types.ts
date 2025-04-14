// src/lib/auth/types.ts
import { User as NextAuthUser } from "next-auth";
import { ObjectId } from "mongoose";

/**
 * สถานะของกระบวนการ Authentication
 */
export enum AuthState {
  UNAUTHENTICATED = 'unauthenticated',
  AUTHENTICATED = 'authenticated',
  OTP_REQUESTED = 'otp_requested',
  OTP_SENT = 'otp_sent',
  OTP_VERIFIED = 'otp_verified',
  CREATING_PROFILE = 'creating_profile',
  LINE_AUTHENTICATING = 'line_authenticating',
  LOADING = 'loading',
  ERROR = 'error',
}

/**
 * Provider ที่รองรับ
 */
export enum AuthProvider {
  OTP = 'otp',
  LINE = 'line',
}

/**
 * ข้อมูลส่วนตัวของผู้ใช้
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string;
  provider: AuthProvider;
  useOriginalData?: boolean;
  originalLineData?: {
    name: string;
    email: string;
    profileImage: string | null;
  };
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ข้อมูลการเข้าสู่ระบบของผู้ใช้สำหรับ database schema
 */
export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  provider: string;
  provider_id?: string;
  profile_image: string | null;
  bio: string;
  role: string;
  is_active: boolean;
  original_line_data?: {
    name: string;
    email: string;
    profile_image: string | null;
  };
  use_original_data: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ข้อมูล OTP สำหรับ database schema
 */
export interface OtpDocument {
  _id: ObjectId;
  email: string;
  otp_code: string;
  is_used: boolean;
  expires_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ข้อมูลประวัติการเข้าสู่ระบบสำหรับ database schema
 */
export interface LoginHistoryDocument {
  _id: ObjectId;
  user_id: ObjectId;
  session_id: string;
  login_time: Date;
  ip_address: string;
  user_agent: string;
  login_status: 'success' | 'failed';
  device_info?: string;
  location?: string;
  session_logout_date?: Date;
  logout_reason?: 'user_request' | 'timeout' | 'security_alert' | 'admin_action' | 'system';
  is_current_session: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ข้อมูลประวัติการเข้าสู่ระบบสำหรับการแสดงผล
 */
export interface LoginHistoryItem {
  id: string;
  sessionId: string;
  loginTime: Date;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string;
  location?: string;
  logoutDate?: Date;
  isCurrentSession: boolean;
  isCurrentIp?: boolean;
  logoutReason?: string;
}

/**
 * Custom User extension สำหรับ NextAuth
 */
export interface CustomUser extends NextAuthUser {
  id: string;
  provider?: string;
  isNewUser?: boolean;
}