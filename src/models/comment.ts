// src/models/comment.ts
import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    post_id: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: false,
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
    content: {
      type: String,
      required: true,
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
      index: { expires: 0 } // 0 หมายถึงลบเมื่อถึงเวลาที่กำหนด
    }
  },
  { timestamps: true }
);

// เพิ่ม index
commentSchema.index({ post_id: 1 });
commentSchema.index({ user_bkc_id: 1 });
commentSchema.index({ parent_id: 1 });

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
export default Comment;