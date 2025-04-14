// src/lib/auth/authOptions.ts
import { AuthOptions, Session, Profile } from "next-auth";
import { User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import { connectDB } from "@/lib/mongodb";
import OTP from "@/models/otp";
import { JWT } from "next-auth/jwt";
import mongoose from 'mongoose';
import { UserRepository } from "@/lib/repositories/userRepository";
import { LoginHistoryRepository } from "@/lib/repositories/loginHistoryRepository";
import { AuthProvider, CustomUser } from "./types";
import { headers } from "next/headers";

// สร้าง Repository instances
const userRepository = new UserRepository();
const loginHistoryRepository = new LoginHistoryRepository();

/**
 * ดึงข้อมูล IP และ User-Agent จาก request
 * @returns ข้อมูล client
 */
function getClientInfo(): { ipAddress: string; userAgent: string } {
  const headersList = headers();
  
  const userAgent = headersList.get('user-agent') || 'Unknown';
  const ipAddress = headersList.get('x-forwarded-for') ||
    headersList.get('x-real-ip') ||
    '127.0.0.1';
  
  return { ipAddress, userAgent };
}

/**
 * บันทึกประวัติการเข้าสู่ระบบ
 * @param userId ID ของผู้ใช้
 * @param status สถานะการเข้าสู่ระบบ
 * @returns ข้อมูล client และ session ID
 */
async function saveLoginHistory(userId: string, status: 'success' | 'failed'): Promise<{ ipAddress: string; userAgent: string; sessionId: string }> {
  try {
    const { ipAddress, userAgent } = getClientInfo();
    
    console.log("Auth: Saving login history", {
      userId,
      status,
      ipAddress,
      userAgent
    });
    
    const loginHistory = await loginHistoryRepository.saveLoginHistory(userId, {
      ipAddress,
      userAgent,
      status
    });
    
    return { 
      ipAddress, 
      userAgent, 
      sessionId: loginHistory.session_id
    };
  } catch (error) {
    console.error("Error saving login history:", error);
    return { 
      ipAddress: '127.0.0.1', 
      userAgent: 'Unknown', 
      sessionId: new mongoose.Types.ObjectId().toString()
    };
  }
}

/**
 * Interface สำหรับ LINE profile
 */
interface LineProfile extends Profile {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

/**
 * Interface สำหรับข้อมูลการยืนยัน OTP
 */
interface OTPUserCredentials {
  email: string;
  otp: string;
}

/**
 * NextAuth configuration options
 */
export const authOptions: AuthOptions = {
  providers: [
    // LINE Provider
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID || "",
      clientSecret: process.env.LINE_CLIENT_SECRET || "",
      authorization: { params: { scope: "openid profile email" } }
    }),

    // OTP Provider (Custom Credentials Provider)
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials) return null;
      
        const { email, otp } = credentials as OTPUserCredentials;
        
        console.log("Auth: OTP login attempt", { email, otpLength: otp?.length });
        
        try {
          await connectDB();
      
          // ตรวจสอบ OTP
          const validOtp = await OTP.findOne({
            email,
            otp_code: otp,
            is_used: false,
            expires_at: { $gt: new Date() }
          });
      
          if (!validOtp) {
            console.log("Auth: Invalid OTP for email:", email);
            return null;
          }
      
          // ทำเครื่องหมายว่า OTP ถูกใช้งานแล้ว
          await OTP.findByIdAndUpdate(validOtp._id, { is_used: true });
          console.log("Auth: OTP marked as used:", validOtp._id);
      
          // ค้นหาผู้ใช้ด้วย Repository
          const userDoc = await userRepository.findUser({
            email,
            provider: AuthProvider.OTP
          });
          
          if (!userDoc) {
            // ถ้าเป็นการล็อกอินครั้งแรก ให้ส่งค่ากลับพิเศษ
            console.log("Auth: First-time OTP login, returning new-user status");
            return {
              id: 'new-user',
              email,
              name: '',
              image: null,
              provider: AuthProvider.OTP,
              isNewUser: true
            } as CustomUser;
          }
      
          // บันทึกประวัติการเข้าสู่ระบบ
          const { sessionId } = await saveLoginHistory(userDoc._id.toString(), 'success');
          console.log("Auth: Login history saved with session ID:", sessionId);
      
          // แปลงข้อมูลผู้ใช้เป็นรูปแบบที่ต้องการ
          const user = userRepository.mapToUserProfile(userDoc);
          
          console.log("Auth: OTP login successful for existing user", {
            id: user.id,
            name: user.name,
            provider: user.provider
          });
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            provider: AuthProvider.OTP
          } as CustomUser;
        } catch (error) {
          console.error("Error in OTP authorize:", error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Auth: Sign in attempt", { 
        provider: account?.provider,
        userId: user?.id,
        userName: user?.name
      });
      
      console.log("Auth: Profile data:", profile);
    
      try {
        await connectDB();
    
        // จัดการกับการล็อกอินผ่าน LINE
        if (account?.provider === "line" && profile) {
          const lineProfile = profile as LineProfile;
          const { name, email, picture } = lineProfile;
          const provider_id = lineProfile.sub;
    
          console.log("Auth: LINE login with provider_id:", provider_id);
          
          // ค้นหาผู้ใช้ด้วย Repository
          let userDoc = await userRepository.findUser({
            lineId: provider_id
          });
    
          if (userDoc) {
            console.log("Auth: Existing LINE user found:", userDoc._id.toString());
            
            // อัพเดทข้อมูลต้นฉบับจาก LINE
            userDoc = await userRepository.updateUser(userDoc._id.toString(), {
              original_line_data: {
                name,
                email,
                profile_image: picture
              }
            });
    
            // บันทึกประวัติการเข้าสู่ระบบ
            const { sessionId } = await saveLoginHistory(userDoc._id.toString(), 'success');
            console.log("Auth: Login history saved for LINE user with session ID:", sessionId);
    
            // ตั้งค่า provider ให้กับ user
            user.provider = AuthProvider.LINE;
            // ตั้งค่า ID ให้ถูกต้อง
            user.id = userDoc._id.toString();
    
            return true;
          } else {
            // สร้างผู้ใช้ใหม่สำหรับ LINE
            console.log("Auth: Creating new LINE user");
            
            const newUser = await userRepository.createUser({
              email,
              name,
              provider: AuthProvider.LINE,
              provider_id,
              profile_image: picture,
              original_line_data: {
                name,
                email,
                profile_image: picture
              },
              use_original_data: true // ใช้ข้อมูลจาก LINE เป็นค่าเริ่มต้น
            });
    
            console.log("Auth: New LINE user created:", newUser._id.toString());
            
            // บันทึกประวัติการเข้าสู่ระบบ
            const { sessionId } = await saveLoginHistory(newUser._id.toString(), 'success');
            console.log("Auth: Login history saved for new LINE user with session ID:", sessionId);
    
            // ตั้งค่า provider และ ID ให้กับ user
            user.provider = AuthProvider.LINE;
            user.id = newUser._id.toString();
            user.isNewUser = true;
    
            return true;
          }
        }
    
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        const customUser = user as CustomUser;
        
        console.log("Auth: JWT callback for user", {
          id: customUser.id, 
          provider: customUser.provider,
          isNewUser: customUser.isNewUser
        });
        
        token.userId = customUser.id;
        token.provider = customUser.provider || 'unknown';

        // สำหรับผู้ใช้ใหม่ที่ล็อกอินด้วย OTP
        if (customUser.isNewUser) {
          token.isNewUser = true;
          console.log("Auth: JWT marked as new user");
        }
        
        console.log("Auth: JWT token updated", { 
          userId: token.userId, 
          provider: token.provider,
          isNewUser: token.isNewUser
        });
      } else if (account?.provider === "line") {
        // มีการเรียก callback นี้หลายครั้ง แต่ต้องการให้ค่า token คงอยู่
        console.log("Auth: JWT callback from LINE provider, keeping existing token values");
      }
      
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      console.log("Auth: Session callback with token", { 
        userId: token.userId, 
        provider: token.provider,
        isNewUser: token.isNewUser 
      });
      
      if (token && session.user) {
        session.user.id = token.userId;
        session.user.provider = token.provider;

        if (token.isNewUser) {
          session.user.isNewUser = true;
          console.log("Auth: Session marked as new user");
        }
        
        console.log("Auth: Session updated", { 
          userId: session.user.id, 
          provider: session.user.provider,
          isNewUser: session.user.isNewUser
        });
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",
};