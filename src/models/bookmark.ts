// src/models/bookmark.ts
import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new Schema(
  {
    // ลบการอ้างอิง user_id เป็น ObjectId ออก และใช้ user_bkc_id เป็นหลัก
    user_bkc_id: {
      type: String,
      required: true,
      // ลบ index: true ตรงนี้ออก เพราะเราจะใช้ schema.index() ข้างล่าง
    },
    post_id: {
      type: String,
      required: true,
    },
    post_title: {
      type: String,
      required: true,
    },
    post_slug: {
      type: String,
      required: true,
    },
    post_category: {
      type: String,
      required: true,
    },
    post_image: {
      type: String,
      default: null,
    },
    // เพิ่ม field content_type เพื่อระบุว่าเป็น bookmark ของอะไร
    content_type: {
      type: String,
      enum: ['blog', 'place'],
      default: 'blog',
      required: true,
    },
  },
  { timestamps: true }
);

// สร้าง unique index ที่ user_bkc_id และ post_id เพื่อป้องกันการบุ๊คมาร์กซ้ำ
bookmarkSchema.index({ user_bkc_id: 1, post_id: 1 }, { unique: true });

const Bookmark = mongoose.models.Bookmark || mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;