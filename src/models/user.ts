// src/models/user.ts
import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new Schema(
  {
    bkc_id: {
      type: String,
      required: true,
      unique: true, // ระบุ unique แทนการใช้ index
      default: () => uuidv4()
    },
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
    line_id: {
      type: String,
      default: null,
      unique: true, // ใช้ unique ในการกำหนด field แทน
      sparse: true // ยังคง sparse ไว้เพื่อให้ค่า null ซ้ำกันได้
    },
    profile_image: {
      type: String,
      default: null,
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
    profile_completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// ลบการประกาศ index แบบ manual ออก เพราะเราใช้ unique: true ในการกำหนดฟิลด์แล้ว
// userSchema.index({ bkc_id: 1 }, { unique: true });
// userSchema.index({ line_id: 1 }, { unique: true, sparse: true });

// ยังคงเก็บ compound index ไว้
userSchema.index({ email: 1, provider: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;