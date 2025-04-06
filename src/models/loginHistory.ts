import mongoose, { Schema } from "mongoose";

const loginHistorySchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    }
  },
  { timestamps: true }
);

// เพิ่ม index
loginHistorySchema.index({ user_id: 1 });
loginHistorySchema.index({ login_time: -1 });

const LoginHistory = mongoose.models.LoginHistory || mongoose.model("LoginHistory", loginHistorySchema);
export default LoginHistory;