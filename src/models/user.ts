// src/models/user.ts
import mongoose, { Schema } from "mongoose";

// สร้าง Schema สำหรับข้อมูลต้นฉบับจาก LINE
const originalLineDataSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  profile_image: {
    type: String,
    default: null
  }
}, { _id: false });

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: ['otp', 'line'],
      default: 'otp',
      required: true
    },
    provider_id: {
      type: String,
      default: null,
    },
    profile_image: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      required: false,
      default: "user",
    },
    is_active: {
      type: Boolean,
      default: true
    },
    // เพิ่มฟิลด์สำหรับเก็บข้อมูลต้นฉบับจาก LINE
    original_line_data: {
      type: originalLineDataSchema,
      default: null
    },
    // เพิ่มฟิลด์เพื่อติดตามว่ากำลังใช้ข้อมูลต้นฉบับหรือข้อมูลที่แก้ไขเอง
    use_original_data: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// สร้าง compound index สำหรับป้องกันการซ้ำกัน
// ผู้ใช้ otp ไม่สามารถมีอีเมลซ้ำกัน
// ผู้ใช้ line ไม่สามารถมี provider_id ซ้ำกัน
userSchema.index({ email: 1, provider: 1 }, { unique: true });
userSchema.index({ provider_id: 1 }, { unique: true, sparse: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;