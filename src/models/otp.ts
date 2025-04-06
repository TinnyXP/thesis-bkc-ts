import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp_code: {
      type: String,
      required: true,
    },
    is_used: {
      type: Boolean,
      default: false,
    },
    expires_at: {
      type: Date,
      required: true,
    }
  },
  { timestamps: true }
);

// รหัส OTP หมดอายุอัตโนมัติเมื่อถึงเวลาที่กำหนดใน expires_at
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// เพิ่ม index เพื่อการค้นหาที่เร็วขึ้น
otpSchema.index({ email: 1, otp_code: 1 });

const OTP = mongoose.models.OTP || mongoose.model("OTP", otpSchema);
export default OTP;