// src/models/forum.ts
import mongoose, { Schema } from "mongoose";

export interface ForumPostDocument extends mongoose.Document {
  title: string;
  content: string;
  user_bkc_id: string;
  user_name: string;
  user_image?: string;
  view_count: number;
  is_pinned: boolean;
  is_deleted: boolean;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  expireAt?: Date;
}

export interface ForumReplyDocument extends mongoose.Document {
  post_id: string;
  content: string;
  user_bkc_id: string;
  user_name: string;
  user_image?: string;
  is_solution: boolean;
  is_deleted: boolean;
  parent_id?: string;
  createdAt: Date;
  updatedAt: Date;
  expireAt?: Date;
}

// Schema สำหรับกระทู้
const forumPostSchema = new Schema<ForumPostDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
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
    view_count: {
      type: Number,
      default: 0,
    },
    is_pinned: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
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

// Schema สำหรับการตอบกระทู้
const forumReplySchema = new Schema<ForumReplyDocument>(
  {
    post_id: {
      type: String,
      required: true,
    },
    content: {
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
    is_solution: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    parent_id: {
      type: String,
      default: null,
    },
    expireAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

// สร้าง index สำหรับการค้นหาที่รวดเร็ว
forumPostSchema.index({ user_bkc_id: 1 });
forumPostSchema.index({ category: 1 });
forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ is_pinned: -1, createdAt: -1 });
forumPostSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

forumReplySchema.index({ post_id: 1 });
forumReplySchema.index({ user_bkc_id: 1 });
forumReplySchema.index({ parent_id: 1 });
forumReplySchema.index({ createdAt: 1 });
forumReplySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// สร้าง Model
const ForumPost = mongoose.models.ForumPost || mongoose.model<ForumPostDocument>("ForumPost", forumPostSchema);
const ForumReply = mongoose.models.ForumReply || mongoose.model<ForumReplyDocument>("ForumReply", forumReplySchema);

export { ForumPost, ForumReply };