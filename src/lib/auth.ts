import { AuthOptions, Session, Profile } from "next-auth";
import { User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user"; 
import OTP from "@/models/otp";
import LoginHistory from "@/models/loginHistory";
import { headers } from "next/headers";
import { JWT } from "next-auth/jwt";
import mongoose from 'mongoose';

// แก้ไข interface ClientInfo โดยเพิ่ม sessionId
interface ClientInfo {
  ip: string;
  userAgent: string;
  sessionId?: string;
}

// ฟังก์ชันช่วยบันทึกประวัติการล็อกอิน
export async function saveLoginHistory(userId: string, status: 'success' | 'failed'): Promise<ClientInfo> {
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'Unknown';
    const ip = headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      '127.0.0.1';
    
    // สร้าง session ID ใหม่
    const sessionId = new mongoose.Types.ObjectId().toString();

    console.log("Auth: Saving login history", {
      userId,
      status,
      ip,
      userAgent,
      sessionId
    });

    await LoginHistory.create({
      user_id: userId,
      session_id: sessionId,
      login_time: new Date(),
      ip_address: ip,
      user_agent: userAgent,
      login_status: status,
      is_current_session: true
    });

    return { ip, userAgent, sessionId };
  } catch (error) {
    console.error("Error saving login history:", error);
    return { ip: '127.0.0.1', userAgent: 'Unknown', sessionId: 'error' };
  }
}

interface LineProfile extends Profile {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

interface OTPUserCredentials {
  email: string;
  otp: string;
}

interface CustomUser extends NextAuthUser {
  provider?: string;
  isNewUser?: boolean;
}

export const authOptions: AuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID || "",
      clientSecret: process.env.LINE_CLIENT_SECRET || "",
      authorization: { params: { scope: "openid profile email" } }
    }),

    // OTP Provider
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
      
          // ค้นหาผู้ใช้
          const user = await UserModel.findOne({ email, provider: 'otp' });
          
          console.log("Auth: User search result for email", email, ":", user ? "Found" : "Not found");
      
          if (!user) {
            // ถ้าเป็นการล็อกอินครั้งแรก ให้ส่งค่ากลับพิเศษ
            console.log("Auth: First-time OTP login, returning new-user status");
            return {
              id: 'new-user',
              email,
              name: '',
              image: null,
              provider: 'otp',
              isNewUser: true
            } as CustomUser;
          }
      
          // บันทึกประวัติการล็อกอิน
          const clientInfo = await saveLoginHistory(user._id.toString(), 'success');
          console.log("Auth: Login history saved with session ID:", clientInfo.sessionId);
      
          console.log("Auth: OTP login successful for existing user", {
            id: user._id.toString(),
            name: user.name,
            provider: 'otp'
          });
          
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.profile_image,
            provider: 'otp'
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
          
          // ค้นหาผู้ใช้จาก provider_id
          let existingUser = await UserModel.findOne({
            provider: 'line',
            provider_id
          });
    
          if (existingUser) {
            console.log("Auth: Existing LINE user found:", existingUser._id.toString());
            
            // เก็บข้อมูลจาก LINE ไว้ในฟิลด์ original_line_data
            // แต่ไม่ได้อัพเดทข้อมูลหลักของผู้ใช้ (เพื่อรักษาข้อมูลที่ผู้ใช้แก้ไขเอง)
            existingUser = await UserModel.findByIdAndUpdate(
              existingUser._id,
              {
                original_line_data: {
                  name,
                  email,
                  profile_image: picture
                }
              },
              { new: true }
            );
    
            // บันทึกประวัติการล็อกอิน
            const clientInfo = await saveLoginHistory(existingUser._id.toString(), 'success');
            console.log("Auth: Login history saved for LINE user with session ID:", clientInfo.sessionId);
    
            // ตั้งค่า provider ให้กับ user
            user.provider = 'line';
            // ตั้งค่า ID ให้ถูกต้อง
            user.id = existingUser._id.toString();
    
            return true;
          } else {
            // สร้างผู้ใช้ใหม่สำหรับ LINE (ไม่ต้องไปที่ create-profile)
            console.log("Auth: Creating new LINE user");
            
            const newUser = await UserModel.create({
              email,
              name,
              profile_image: picture,
              provider: 'line',
              provider_id,
              original_line_data: {
                name,
                email,
                profile_image: picture
              },
              is_active: true,
              use_original_data: true // ใช้ข้อมูลจาก LINE เป็นค่าเริ่มต้น
            });
    
            console.log("Auth: New LINE user created:", newUser._id.toString());
            
            // บันทึกประวัติการล็อกอิน
            const clientInfo = await saveLoginHistory(newUser._id.toString(), 'success');
            console.log("Auth: Login history saved for new LINE user with session ID:", clientInfo.sessionId);
    
            // ตั้งค่า provider และ ID ให้กับ user
            user.provider = 'line';
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