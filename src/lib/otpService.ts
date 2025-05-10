import nodemailer from 'nodemailer';

/**
 * สร้างรหัส OTP แบบสุ่ม
 * @param length ความยาวของรหัส OTP
 * @returns รหัส OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
}

/**
 * ส่งอีเมลแจ้งรหัส OTP
 * @param email อีเมลที่จะส่งไป
 * @param otpCode รหัส OTP
 */
export async function sendOTPEmail(email: string, otpCode: string): Promise<void> {
  try {
    // สร้าง transporter สำหรับส่งอีเมล
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // เนื้อหาของอีเมล
    const mailOptions = {
      from: `"Bangkrachao" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'รหัสยืนยันเข้าสู่ระบบ Bangkrachao',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #10CE50;">รหัสยืนยันเข้าสู่ระบบ</h2>
          <p>สวัสดีครับ,</p>
          <p>นี่คือรหัส OTP สำหรับเข้าสู่ระบบของคุณ:</p>
          <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>รหัสนี้จะหมดอายุใน 10 นาที</p>
          <p>หากคุณไม่ได้ขอรหัสนี้ กรุณาไม่ต้องดำเนินการใดๆ และแจ้งให้เราทราบ</p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
          </p>
        </div>
      `
    };
    
    // ส่งอีเมล
    await transporter.sendMail(mailOptions);
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

/**
 * ส่งอีเมลแจ้งเตือนการเข้าสู่ระบบ
 * @param email อีเมลที่จะส่งไป
 * @param name ชื่อผู้ใช้
 * @param clientInfo ข้อมูลของไคลเอนต์ที่เข้าสู่ระบบ
 */
export async function sendLoginNotificationEmail(
  email: string, 
  name: string, 
  clientInfo: { ip: string; userAgent: string }
): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    const date = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    
    const mailOptions = {
      from: `"Bangkrachao" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'แจ้งเตือนการเข้าสู่ระบบ Bangkrachao',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #10CE50;">แจ้งเตือนการเข้าสู่ระบบ</h2>
          <p>สวัสดีคุณ ${name},</p>
          <p>มีการเข้าสู่ระบบในบัญชีของคุณเมื่อ:</p>
          <ul>
            <li><strong>เวลา:</strong> ${date}</li>
            <li><strong>IP Address:</strong> ${clientInfo.ip || 'ไม่ทราบ'}</li>
            <li><strong>อุปกรณ์:</strong> ${clientInfo.userAgent || 'ไม่ทราบ'}</li>
          </ul>
          <p>หากไม่ใช่คุณ กรุณาติดต่อเราทันทีที่ support@bangkrachao.com</p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
  } catch (error) {
    console.error('Error sending login notification email:', error);
    // ไม่ throw error เพราะนี่เป็นฟีเจอร์เสริม ไม่ควรทำให้การล็อกอินล้มเหลว
  }
}