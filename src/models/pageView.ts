// src/models/pageView.ts
import mongoose, { Schema } from "mongoose";

export interface PageViewDocument extends mongoose.Document {
  page_type: 'homepage' | 'blog' | 'place';
  slug: string;
  ip_address: string;
  view_date: string; // format: YYYY-MM-DD
  view_count: number;
  createdAt: Date;
  updatedAt: Date;
}

const pageViewSchema = new Schema(
  {
    page_type: {
      type: String,
      enum: ['homepage', 'blog', 'place'],
      required: true,
    },
    slug: {
      type: String,
      required: true,
      default: 'home',
    },
    ip_address: {
      type: String,
      required: true,
    },
    view_date: {
      type: String,
      required: true,
    },
    view_count: {
      type: Number,
      default: 1,
    }
  },
  { timestamps: true }
);

// สร้าง compound index เพื่อให้การค้นหาเร็วขึ้น
pageViewSchema.index({ page_type: 1, slug: 1, ip_address: 1, view_date: 1 }, { unique: true });
pageViewSchema.index({ page_type: 1, slug: 1 });

const PageView = mongoose.models.PageView || mongoose.model<PageViewDocument>("PageView", pageViewSchema);
export default PageView;