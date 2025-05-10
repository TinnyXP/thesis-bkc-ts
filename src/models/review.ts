import mongoose, { Schema } from "mongoose";

// กำหนด interface สำหรับ Review
export interface ReviewDocument extends mongoose.Document {
  place_id: string;
  user_bkc_id: string;
  user_name: string;
  user_image?: string;
  rating: number;
  title: string;
  content: string;
  is_deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema(
  {
    place_id: {
      type: String,
      required: true,
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    expireAt: {
      type: Date,
      default: null,
      index: { expires: 0 } // 0 หมายถึงลบเมื่อถึงเวลาที่กำหนด
    }
  },
  { timestamps: true }
);

// สร้าง index สำหรับการค้นหาที่รวดเร็ว
reviewSchema.index({ place_id: 1, createdAt: -1 });
reviewSchema.index({ user_bkc_id: 1 });

const Review = mongoose.models.Review || mongoose.model<ReviewDocument>("Review", reviewSchema);
export default Review;