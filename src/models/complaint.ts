// src/models/complaint.ts
import mongoose, { Schema } from "mongoose";

export interface ComplaintDocument extends mongoose.Document {
  title: string;
  content: string;
  location: string;
  images: string[];
  user_bkc_id: string;
  user_name: string;
  user_image?: string;
  status: 'pending' | 'inprogress' | 'resolved' | 'rejected';
  is_anonymous: boolean;
  is_deleted: boolean;
  responses: Array<{
    content: string;
    admin_id: string;
    admin_name: string;
    created_at: Date;
  }>;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  expireAt?: Date;
}

const complaintSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    user_bkc_id: {
      type: String,
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    },
    user_image: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'inprogress', 'resolved', 'rejected'],
      default: 'pending',
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    responses: [
      {
        content: {
          type: String,
          required: true,
        },
        admin_id: {
          type: String,
          required: true,
        },
        admin_name: {
          type: String,
          required: true,
        },
        created_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    category: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    expireAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

// สร้าง index สำหรับการค้นหาที่รวดเร็ว
complaintSchema.index({ user_bkc_id: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// สร้าง Model
const Complaint = mongoose.models.Complaint || mongoose.model<ComplaintDocument>("Complaint", complaintSchema);
export default Complaint;