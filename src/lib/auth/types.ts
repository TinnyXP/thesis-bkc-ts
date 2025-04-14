/**
 * Types สำหรับระบบ Mock Auth
 */

// Auth Provider enum
export enum AuthProvider {
  OTP = 'otp',
  LINE = 'line'
}

// สถานะการทำงานของระบบ auth
export enum AuthState {
  UNAUTHENTICATED = 'unauthenticated',
  AUTHENTICATED = 'authenticated',
  LOADING = 'loading',
  ERROR = 'error'
}

// ข้อมูลโปรไฟล์ผู้ใช้
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string;
  provider: AuthProvider;
  useOriginalLineData?: boolean;
  originalLineData?: {
    name: string;
    email: string;
    profileImage: string | null;
  };
}

// ข้อมูลประวัติการเข้าสู่ระบบ
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

// ข้อมูลการแบ่งหน้า
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}