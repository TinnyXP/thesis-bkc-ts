"use client";

import { useState } from "react";
import { Button, Avatar, Textarea, Divider, Spinner } from "@heroui/react";
import { FaRegComment, FaPaperPlane, FaReply, FaUserCircle } from "react-icons/fa";
import { useComments, Comment } from "@/hooks/useComments";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { data: session } = useSession();
  const { comments, isLoading, addComment } = useComments(postId);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      setError("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
      return;
    }
    
    if (!commentText.trim()) {
      setError("กรุณากรอกข้อความ");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const result = await addComment(commentText);
      
      if (result.success) {
        setCommentText("");
      } else {
        setError(result.message || "ไม่สามารถเพิ่มความคิดเห็นได้");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FaRegComment />
        ความคิดเห็น ({comments.length})
      </h3>

      {/* ฟอร์มเพิ่มคอมเมนต์ */}
      <div className="mb-6">
        {session ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Avatar
                src={session.user.image || undefined}
                fallback={<FaUserCircle />}
                className="flex-shrink-0"
              />
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="เขียนความคิดเห็น..."
                minRows={2}
                variant="bordered"
                isDisabled={isSubmitting}
              />
            </div>
            
            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}
            
            <div className="self-end">
              <Button
                color="primary"
                type="submit"
                isLoading={isSubmitting}
                startContent={<FaPaperPlane />}
              >
                ส่งความคิดเห็น
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg text-center">
            <p className="mb-2">กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น</p>
            <Button
              color="primary"
              as={Link}
              href="/login"
              className="mt-2"
            >
              เข้าสู่ระบบ
            </Button>
          </div>
        )}
      </div>

      <Divider className="my-4" />

      {/* แสดงคอมเมนต์ */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner color="primary" label="กำลังโหลดความคิดเห็น..." />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment: Comment) => (
            <div key={comment._id} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Avatar
                  src={comment.user_image || undefined}
                  fallback={<FaUserCircle />}
                  className="flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{comment.user_name}</h4>
                      <p className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: th
                        })}
                      </p>
                    </div>
                    {/* ถ้าต้องการเพิ่มปุ่มตอบกลับหรือลบคอมเมนต์ */}
                    {session && (
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        startContent={<FaReply size={14} />}
                      >
                        ตอบกลับ
                      </Button>
                    )}
                  </div>
                  <p className="mt-2">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-4 text-zinc-500">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น</p>
        )}
      </div>
    </div>
  );
}