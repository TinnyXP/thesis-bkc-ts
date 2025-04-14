// src/lib/auth/authStateMachine.ts
import { createMachine, assign, DoneInvokeEvent } from 'xstate';
import { AuthState, UserProfile } from './types';
import { Session } from 'next-auth';

interface AuthContext {
  session: Session | null;
  user: UserProfile | null;
  email: string | null;
  error: string | null;
  isNewUser: boolean;
}

type AuthEvent =
  | { type: 'CHECK_SESSION' }
  | { type: 'SESSION_FOUND'; session: Session }
  | { type: 'NO_SESSION' }
  | { type: 'LOGIN_OTP'; email: string }
  | { type: 'OTP_SENT'; email: string }
  | { type: 'VERIFY_OTP'; otp: string }
  | { type: 'OTP_VERIFIED'; user: UserProfile | null; isNewUser: boolean }
  | { type: 'LOGIN_LINE' }
  | { type: 'LINE_CALLBACK'; session: Session }
  | { type: 'CREATE_PROFILE'; profile: Partial<UserProfile> }
  | { type: 'PROFILE_CREATED'; user: UserProfile }
  | { type: 'LOGOUT' }
  | { type: 'ERROR'; message: string };

/**
 * State Machine สำหรับจัดการขั้นตอนการ Authentication
 */
export const authMachine = createMachine<AuthContext, AuthEvent>({
  id: 'auth',
  initial: AuthState.LOADING,
  context: {
    session: null,
    user: null,
    email: null,
    error: null,
    isNewUser: false,
  },
  states: {
    // กำลังโหลดและตรวจสอบ session
    [AuthState.LOADING]: {
      on: {
        CHECK_SESSION: {
          target: AuthState.LOADING,
          actions: 'clearError',
        },
        SESSION_FOUND: {
          target: AuthState.AUTHENTICATED,
          actions: assign({
            session: (_, event) => event.session,
            isNewUser: (_, event) => !!event.session.user.isNewUser,
          }),
        },
        NO_SESSION: {
          target: AuthState.UNAUTHENTICATED,
        },
        ERROR: {
          target: AuthState.ERROR,
          actions: assign({
            error: (_, event) => event.message,
          }),
        },
      },
    },
    
    // ยังไม่ได้เข้าสู่ระบบ
    [AuthState.UNAUTHENTICATED]: {
      on: {
        LOGIN_OTP: {
          target: AuthState.OTP_REQUESTED,
          actions: assign({
            email: (_, event) => event.email,
            error: null,
          }),
        },
        LOGIN_LINE: {
          target: AuthState.LINE_AUTHENTICATING,
          actions: 'clearError',
        },
        SESSION_FOUND: {
          target: AuthState.AUTHENTICATED,
          actions: assign({
            session: (_, event) => event.session,
            isNewUser: (_, event) => !!event.session.user.isNewUser,
          }),
        },
      },
    },
    
    // เข้าสู่ระบบสำเร็จ
    [AuthState.AUTHENTICATED]: {
      on: {
        LOGOUT: {
          target: AuthState.UNAUTHENTICATED,
          actions: 'clearSession',
        },
      },
      initial: 'checkingProfile',
      states: {
        // ตรวจสอบว่าเป็นผู้ใช้ใหม่หรือไม่
        checkingProfile: {
          always: [
            {
              target: 'needsProfile',
              cond: (context) => context.isNewUser,
            },
            { target: 'complete' },
          ],
        },
        // ต้องสร้างโปรไฟล์
        needsProfile: {
          on: {
            CREATE_PROFILE: {
              target: 'creatingProfile',
            },
          },
        },
        // กำลังสร้างโปรไฟล์
        creatingProfile: {
          on: {
            PROFILE_CREATED: {
              target: 'complete',
              actions: assign({
                user: (_, event) => event.user,
                isNewUser: false,
              }),
            },
            ERROR: {
              target: 'needsProfile',
              actions: assign({
                error: (_, event) => event.message,
              }),
            },
          },
        },
        // โปรไฟล์สมบูรณ์
        complete: {
          type: 'final',
        },
      },
    },
    
    // ขั้นตอนการขอ OTP
    [AuthState.OTP_REQUESTED]: {
      on: {
        OTP_SENT: {
          target: AuthState.OTP_SENT,
          actions: assign({
            email: (_, event) => event.email,
          }),
        },
        ERROR: {
          target: AuthState.UNAUTHENTICATED,
          actions: assign({
            error: (_, event) => event.message,
          }),
        },
      },
    },
    
    // ส่ง OTP แล้ว รอการยืนยัน
    [AuthState.OTP_SENT]: {
      on: {
        VERIFY_OTP: {
          target: AuthState.LOADING,
          actions: 'clearError',
        },
        OTP_VERIFIED: {
          target: AuthState.AUTHENTICATED,
          actions: assign({
            user: (_, event) => event.user,
            isNewUser: (_, event) => event.isNewUser,
          }),
        },
        ERROR: {
          // ยังคงอยู่ในสถานะเดิม แต่เพิ่มข้อความผิดพลาด
          actions: assign({
            error: (_, event) => event.message,
          }),
        },
        // กลับไปขอ OTP ใหม่
        LOGIN_OTP: {
          target: AuthState.OTP_REQUESTED,
          actions: assign({
            email: (_, event) => event.email,
            error: null,
          }),
        },
      },
    },
    
    // กำลังเข้าสู่ระบบด้วย LINE
    [AuthState.LINE_AUTHENTICATING]: {
      on: {
        LINE_CALLBACK: {
          target: AuthState.AUTHENTICATED,
          actions: assign({
            session: (_, event) => event.session,
            isNewUser: (_, event) => !!event.session.user.isNewUser,
          }),
        },
        ERROR: {
          target: AuthState.UNAUTHENTICATED,
          actions: assign({
            error: (_, event) => event.message,
          }),
        },
      },
    },
    
    // เกิดข้อผิดพลาด
    [AuthState.ERROR]: {
      on: {
        CHECK_SESSION: {
          target: AuthState.LOADING,
          actions: 'clearError',
        },
        LOGIN_OTP: {
          target: AuthState.OTP_REQUESTED,
          actions: assign({
            email: (_, event) => event.email,
            error: null,
          }),
        },
        LOGIN_LINE: {
          target: AuthState.LINE_AUTHENTICATING,
          actions: 'clearError',
        },
      },
    },
  },
}, {
  actions: {
    clearError: assign({
      error: null,
    }),
    clearSession: assign({
      session: null,
      user: null,
      isNewUser: false,
    }),
  },
});