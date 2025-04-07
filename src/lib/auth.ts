import { AuthOptions, Session, Profile } from "next-auth";
import { User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user"; // เปลี่ยนชื่อ import จาก User เป็น UserModel
import OTP from "@/models/otp";
import LoginHistory from "@/models/loginHistory";
import { headers } from "next/headers";
import { sendLoginNotificationEmail } from "@/lib/otpService";
import { JWT } from "next-auth/jwt";

interface ClientInfo {
  ip: string;
  userAgent: string;
}

// ฟังก์ชันช่วยบันทึกประวัติการล็อกอิน
export async function saveLoginHistory(userId: string, status: 'success' | 'failed'): Promise<ClientInfo> {
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'Unknown';
    const ip = headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      '127.0.0.1';

    await LoginHistory.create({
      user_id: userId,
      login_time: new Date(),
      ip_address: ip,
      user_agent: userAgent,
      login_status: status
    });

    return { ip, userAgent };
  } catch (error) {
    console.error("Error saving login history:", error);
    return { ip: '127.0.0.1', userAgent: 'Unknown' };
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
            console.log("Invalid OTP for email:", email);
            return null;
          }

          // ทำเครื่องหมายว่า OTP ถูกใช้งานแล้ว
          await OTP.findByIdAndUpdate(validOtp._id, { is_used: true });

          // ค้นหาผู้ใช้
          const user = await UserModel.findOne({ email, provider: 'otp' });

          if (!user) {
            // ถ้าเป็นการล็อกอินครั้งแรก ให้ส่งค่ากลับพิเศษ
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

          // ส่งอีเมลแจ้งเตือนการเข้าสู่ระบบ
          sendLoginNotificationEmail(user.email, user.name, clientInfo);

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
      console.log("Sign in attempt:", { provider: account?.provider, user });
      
      try {
        await connectDB();

        // จัดการกับการล็อกอินผ่าน LINE
        if (account?.provider === "line" && profile) {
          const lineProfile = profile as LineProfile;
          const { name, email, picture } = lineProfile;
          const provider_id = lineProfile.sub;

          // ค้นหาผู้ใช้จาก provider_id
          let existingUser = await UserModel.findOne({
            provider: 'line',
            provider_id
          });

          if (existingUser) {
            // อัพเดทข้อมูลถ้าจำเป็น
            if (existingUser.email !== email || existingUser.name !== name) {
              existingUser = await UserModel.findByIdAndUpdate(
                existingUser._id,
                {
                  email,
                  name,
                  profile_image: picture
                },
                { new: true }
              );
            }

            // บันทึกประวัติการล็อกอิน
            const clientInfo = await saveLoginHistory(existingUser._id.toString(), 'success');

            // ส่งอีเมลแจ้งเตือนการเข้าสู่ระบบ
            sendLoginNotificationEmail(existingUser.email, existingUser.name, clientInfo);

            return true;
          } else {
            // สร้างผู้ใช้ใหม่
            const newUser = await UserModel.create({
              email,
              name,
              profile_image: picture,
              provider: 'line',
              provider_id
            });

            // บันทึกประวัติการล็อกอิน
            await saveLoginHistory(newUser._id.toString(), 'success');

            return true;
          }
        }
        
        // เพิ่มเงื่อนไขสำหรับ OTP หลังจากสร้างโปรไฟล์สำเร็จ
        // ถ้าเป็น OTP และเป็นผู้ใช้ที่สร้างโปรไฟล์เสร็จแล้ว (ไม่ใช่ new-user)
        if (account?.provider === "otp" && user.id !== 'new-user') {
          // บันทึกประวัติการล็อกอิน
          const clientInfo = await saveLoginHistory(user.id, 'success');
          
          // ส่งอีเมลแจ้งเตือนการเข้าสู่ระบบ
          if (user.email) {
            sendLoginNotificationEmail(user.email, user.name || '', clientInfo);
          }
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      // เพิ่มเงื่อนไขสำหรับการอัพเดต token เมื่อมีการอัพเดต session
      if (trigger === "update" && session) {
        // อัพเดต token จากข้อมูลใน session ที่ส่งมา
        if (session.user) {
          if (session.user.name) token.name = session.user.name;
          if (session.user.image) token.picture = session.user.image;
          if (session.user.hasOwnProperty('isNewUser')) token.isNewUser = session.user.isNewUser;
        }
        return token;
      }
      
      // กรณีสร้าง token ครั้งแรกเมื่อ user login
      if (user) {
        const customUser = user as CustomUser;
        token.userId = customUser.id;
        token.provider = customUser.provider || 'unknown';

        // สำหรับผู้ใช้ใหม่ที่ล็อกอินด้วย OTP
        if (customUser.isNewUser) {
          token.isNewUser = true;
        }
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.userId;
        session.user.provider = token.provider;

        // อัพเดตชื่อและรูปโปรไฟล์จาก token ล่าสุด
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture;
        
        // ตรวจสอบว่ามี isNewUser ในโทเค็นหรือไม่
        if (token.hasOwnProperty('isNewUser')) {
          session.user.isNewUser = token.isNewUser;
        }
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