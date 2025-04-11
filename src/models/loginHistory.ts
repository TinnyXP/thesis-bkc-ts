import mongoose, { Schema } from "mongoose";

const loginHistorySchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    session_id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    login_time: {
      type: Date,
      default: Date.now,
    },
    ip_address: {
      type: String,
      required: true,
    },
    user_agent: {
      type: String,
      required: true,
    },
    login_status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    device_info: {
      type: String,
    },
    location: {
      type: String,
    },
    // เพิ่มฟิลด์สำหรับเก็บข้อมูลการ logout
    session_logout_date: {
      type: Date,
      default: null,
    },
    logout_reason: {
      type: String,
      enum: ['user_request', 'timeout', 'security_alert', 'admin_action', 'system'],
      default: null,
    },
    is_current_session: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

// เพิ่ม index
loginHistorySchema.index({ user_id: 1 });
loginHistorySchema.index({ login_time: -1 });
loginHistorySchema.index({ ip_address: 1 });
loginHistorySchema.index({ session_id: 1 });

const LoginHistory = mongoose.models.LoginHistory || mongoose.model("LoginHistory", loginHistorySchema);
export default LoginHistory;