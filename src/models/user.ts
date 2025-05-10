// src/models/user.ts (ปรับปรุงใหม่)
import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface UserDocument extends mongoose.Document {
  bkc_id: string;
  provider: 'otp' | 'line';
  role: 'user' | 'admin' | 'superadmin';  // เพิ่ม role superadmin
  name: string;
  email: string;
  profile_image: string | null;
  line_id: string | null;
  line_default_data: {
    name: string;
    profile_image: string;
  } | null;
  is_active: boolean;
  profile_completed: boolean;
  admin_permissions?: string[]; // สิทธิ์พิเศษของแอดมิน
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    bkc_id: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4()
    },
    provider: {
      type: String,
      enum: ['otp', 'line'],
      default: 'otp',
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],  // เพิ่ม superadmin
      default: "user",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    profile_image: {
      type: String,
      default: null,
    },
    line_id: {
      type: String,
      // default: null,
      // แก้ไขตรงนี้: ใช้ sparse index เพื่อให้สามารถมีหลายเรคอร์ดที่ line_id เป็น null ได้
      // sparse: true จะไม่รวมเอกสารที่ไม่มีฟิลด์หรือเป็น null ในการตรวจสอบ unique
      sparse: true,
      unique: true
    },
    line_default_data: {
      type: {
        name: String,
        profile_image: String
      },
      default: null
    },
    is_active: {
      type: Boolean,
      default: true
    },
    profile_completed: {
      type: Boolean,
      default: false
    },
    admin_permissions: {  // เพิ่มฟิลด์สำหรับเก็บสิทธิ์ของแอดมิน
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

// ยังคงเก็บ compound index ไว้
userSchema.index({ email: 1, provider: 1 }, { unique: true });

// เพิ่ม index สำหรับค้นหาด้วย role
userSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
export default User;