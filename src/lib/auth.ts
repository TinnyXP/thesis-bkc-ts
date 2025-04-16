// src/lib/auth.ts
import { AuthOptions, Session, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import LineProvider from "next-auth/providers/line";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import OTP from "@/models/otp";
import LoginHistory from "@/models/loginHistory";
import { headers } from "next/headers";
import { sendLoginNotificationEmail } from "@/lib/otpService";
import { JWT } from "next-auth/jwt";
import { v4 as uuidv4 } from "uuid";

interface ClientInfo {
  ip: string;
  userAgent: string;
}

interface LineDefaultData {
  name: string;
  profile_image: string;
}

interface UpdateFields {
  email?: string;
  name?: string;
  profile_image?: string;
  line_default_data?: LineDefaultData;
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

        // ใช้ type OTPUserCredentials แทน
        const otpCredentials: OTPUserCredentials = {
          email: credentials.email,
          otp: credentials.otp
        };

        const { email, otp } = otpCredentials;
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

          // ใน authorize callback ของ OTP provider
          if (!user) {
            // สร้าง bkc_id ใหม่
            const bkc_id = uuidv4();

            // สร้างผู้ใช้ใหม่ที่ยังไม่ได้กรอกข้อมูลโปรไฟล์
            const newUser = await UserModel.create({
              email,
              name: email.split('@')[0], // ใช้ส่วนแรกของอีเมลเป็นชื่อชั่วคราว
              provider: 'otp',
              bkc_id, // กำหนดค่า bkc_id ที่สร้างใหม่
              profile_completed: false
            });

            // บันทึกประวัติการล็อกอิน
            await saveLoginHistory(newUser._id.toString(), 'success');

            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
              image: null,
              provider: 'otp',
              bkc_id,  // ส่ง bkc_id กลับไป (required)
              isNewUser: true
            };
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
            provider: 'otp',
            bkc_id: user.bkc_id  // ส่ง bkc_id กลับไป (required)
          };
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
        // แก้ไขที่ src/lib/auth.ts ในส่วน signIn ของ LINE
        if (account?.provider === "line" && profile) {
          const lineProfile = profile as LineProfile;
          const { name, email, picture } = lineProfile;
          const line_id = lineProfile.sub;

          // ค้นหาผู้ใช้จาก line_id
          let existingUser = await UserModel.findOne({
            provider: 'line',
            line_id
          });

          if (existingUser) {
            // อัพเดตเฉพาะข้อมูลที่จำเป็น
            const updateData: UpdateFields = {};

            // อัพเดตอีเมลเสมอ เพราะเป็นข้อมูลสำคัญ
            if (existingUser.email !== email) {
              updateData.email = email;
            }

            // อัพเดตข้อมูล default จาก LINE เสมอ เพื่อเก็บข้อมูลล่าสุด
            updateData.line_default_data = {
              name,
              profile_image: picture
            };

            // ถ้ายังไม่เคยตั้งค่าโปรไฟล์เอง ให้อัพเดตข้อมูลจาก LINE
            if (!existingUser.profile_completed) {
              if (existingUser.name !== name) updateData.name = name;
              if (existingUser.profile_image !== picture) updateData.profile_image = picture;
            }

            // ถ้ามีข้อมูลที่ต้องอัพเดต
            if (Object.keys(updateData).length > 0) {
              existingUser = await UserModel.findByIdAndUpdate(
                existingUser._id,
                updateData,
                { new: true }
              );
            }

            // บันทึกประวัติการล็อกอิน
            const clientInfo = await saveLoginHistory(existingUser._id.toString(), 'success');

            // ส่งอีเมลแจ้งเตือนการเข้าสู่ระบบ
            sendLoginNotificationEmail(existingUser.email, existingUser.name, clientInfo);

            // เพิ่มบรรทัดนี้ เพื่อให้แน่ใจว่าจะส่ง bkc_id กลับไป
            user.bkc_id = existingUser.bkc_id;

            return true;
          } else {
            // สร้าง bkc_id ใหม่
            const bkc_id = uuidv4();

            // สร้างผู้ใช้ใหม่
            const newUser = await UserModel.create({
              email,
              name,
              profile_image: picture,
              provider: 'line',
              line_id,
              bkc_id, // กำหนดค่า bkc_id ที่สร้างใหม่
              // เก็บข้อมูล default ตั้งแต่ตอนสร้างบัญชี
              line_default_data: {
                name,
                profile_image: picture
              },
              profile_completed: false
            });

            // บันทึกประวัติการล็อกอิน
            await saveLoginHistory(newUser._id.toString(), 'success');

            // เพิ่มบรรทัดนี้ เพื่อให้แน่ใจว่าจะส่ง bkc_id กลับไป
            user.bkc_id = bkc_id;

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
          // เพิ่มบรรทัดนี้เพื่อรองรับการอัพเดต bkcId
          if (session.user.bkcId) token.bkcId = session.user.bkcId;
        }
        return token;
      }

      // กรณีสร้าง token ครั้งแรกเมื่อ user login
      if (user) {
        // เก็บข้อมูล MongoDB ID และ bkc_id
        token.userId = user.id;

        // ตรวจสอบว่ามี bkc_id หรือไม่ (ควรมีเสมอตามที่กำหนดใน interface)
        if (user.bkc_id) {
          token.bkcId = user.bkc_id;
        }

        token.provider = user.provider || 'unknown';

        // สำหรับผู้ใช้ใหม่ที่ล็อกอินด้วย OTP
        if (user.isNewUser) {
          token.isNewUser = true;
        }
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.userId;

        // ตรวจสอบ bkcId อย่างชัดเจน
        if (token.bkcId) {
          session.user.bkcId = token.bkcId;
        } else {
          // ถ้าไม่มี bkcId ในโทเค็น ให้ล็อกข้อผิดพลาด
          console.error("Missing bkcId in token:", token);
        }

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