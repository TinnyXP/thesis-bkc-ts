import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new Schema(
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
      required: false,
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
      default: null,
      unique: true,
      sparse: true
    },
    // เพิ่มฟิลด์นี้เพื่อเก็บข้อมูลดั้งเดิมจาก LINE
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
    }
  },
  { timestamps: true }
);

// ยังคงเก็บ compound index ไว้
userSchema.index({ email: 1, provider: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;