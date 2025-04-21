// src/components/ui/Comments/CommentSection.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Avatar,
  Textarea,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination
} from "@heroui/react";
import { FaRegComment, FaPaperPlane, FaReply, FaUserCircle, FaTrash, FaEllipsisV } from "react-icons/fa";
import { useComments, Comment } from "@/hooks/useComments";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import Loading from "@/components/layout/Loading";

// คอมโพเนนต์สำหรับคอมเมนต์ที่ตอบกลับ
const ReplyComment = ({
  comment,
  isOwner,
  onDelete,
  session
}: {
  comment: Comment,
  isOwner: boolean,
  onDelete: (id: string) => void,
  session: Session | null
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // เพิ่ม state เพื่อเก็บข้อมูลผู้ใช้ล่าสุด
  const [updatedUserInfo, setUpdatedUserInfo] = useState({
    name: comment.user_name,
    image: comment.user_image
  });

  // เพิ่ม useEffect เพื่อรับฟังเหตุการณ์เมื่อมีการอัปเดตโปรไฟล์
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      // ตรวจสอบว่าเป็นคอมเมนต์ของผู้ใช้ปัจจุบันหรือไม่
      if (customEvent.detail && session?.user?.bkcId === comment.user_bkc_id) {
        // อัปเดตข้อมูลผู้ใช้สำหรับคอมเมนต์นี้
        setUpdatedUserInfo({
          name: customEvent.detail.name || updatedUserInfo.name,
          image: customEvent.detail.image
        });
      }
    };

    // ลงทะเบียนรับฟังเหตุการณ์
    window.addEventListener('profile-updated', handleProfileUpdated);

    // เมื่อถอดคอมโพเนนต์ออก ให้เลิกรับฟังเหตุการณ์
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [comment.user_bkc_id, session, updatedUserInfo.name]);

  return (
    <div className="ml-8 mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
      <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <Avatar
            src={updatedUserInfo.image || undefined}
            fallback={<FaUserCircle />}
            className="flex-shrink-0 w-7 h-7"
            size="sm"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm">{updatedUserInfo.name}</h4>
                <p className="text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: th
                  })}
                </p>
              </div>

              {isOwner && (
                <Popover placement="bottom-end" isOpen={isOpen} onOpenChange={onOpen}>
                  <PopoverTrigger>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      className="w-6 h-6 min-w-0"
                    >
                      <FaEllipsisV size={12} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto">
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      startContent={<FaTrash size={12} />}
                      onPress={() => {
                        onClose();
                        onDelete(comment._id);
                      }}
                      className="w-full justify-start"
                    >
                      ลบความคิดเห็น
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <p className="mt-1 text-sm">{comment.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// คอมโพเนนต์สำหรับคอมเมนต์หลัก
const CommentItem = ({
  comment,
  replies,
  isOwner,
  onDelete,
  onReply,
  checkOwnership,
  session
}: {
  comment: Comment,
  replies: Comment[],
  isOwner: boolean,
  onDelete: (id: string) => void,
  onReply: (id: string) => void,
  checkOwnership: (comment: Comment) => boolean,
  session: Session | null
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showAllReplies, setShowAllReplies] = useState(false);

  // เพิ่ม state เพื่อเก็บข้อมูลผู้ใช้ล่าสุด
  const [updatedUserInfo, setUpdatedUserInfo] = useState({
    name: comment.user_name,
    image: comment.user_image
  });

  // เพิ่ม useEffect เพื่อรับฟังเหตุการณ์เมื่อมีการอัปเดตโปรไฟล์
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      // ตรวจสอบว่าเป็นคอมเมนต์ของผู้ใช้ปัจจุบันหรือไม่
      if (customEvent.detail && session?.user?.bkcId === comment.user_bkc_id) {
        // อัปเดตข้อมูลผู้ใช้สำหรับคอมเมนต์นี้
        setUpdatedUserInfo({
          name: customEvent.detail.name || updatedUserInfo.name,
          image: customEvent.detail.image
        });
      }
    };

    // ลงทะเบียนรับฟังเหตุการณ์
    window.addEventListener('profile-updated', handleProfileUpdated);

    // เมื่อถอดคอมโพเนนต์ออก ให้เลิกรับฟังเหตุการณ์
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [comment.user_bkc_id, session, updatedUserInfo.name]);

  // แสดงแค่ 2 replies แรกหากไม่กดดูทั้งหมด
  const visibleReplies = showAllReplies ? replies : replies.slice(0, 2);
  const hasMoreReplies = replies.length > 2 && !showAllReplies;

  return (
    <div className="mb-4">
      <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Avatar
            src={updatedUserInfo.image || undefined}
            fallback={<FaUserCircle />}
            className="flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{updatedUserInfo.name}</h4>
                <p className="text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: th
                  })}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  isIconOnly
                  onPress={() => onReply(comment._id)}
                >
                  <FaReply size={14} />
                </Button>

                {isOwner && (
                  <Popover placement="bottom-end" isOpen={isOpen} onOpenChange={onOpen}>
                    <PopoverTrigger>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                      >
                        <FaEllipsisV size={14} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        startContent={<FaTrash size={14} />}
                        onPress={() => {
                          onClose();
                          onDelete(comment._id);
                        }}
                        className="w-full justify-start"
                      >
                        ลบความคิดเห็น
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            <p className="mt-2">{comment.content}</p>
          </div>
        </div>
      </div>

      {/* แสดงการตอบกลับ */}
      {visibleReplies.length > 0 && (
        <div className="mt-1">
          {visibleReplies.map(reply => (
            <ReplyComment
              key={reply._id}
              comment={reply}
              isOwner={checkOwnership(reply)}
              onDelete={onDelete}
              session={session}
            />
          ))}

          {/* ปุ่มดูการตอบกลับทั้งหมด */}
          {hasMoreReplies && (
            <Button
              variant="light"
              size="sm"
              className="ml-12 mt-1"
              onPress={() => setShowAllReplies(true)}
            >
              ดูการตอบกลับทั้งหมด ({replies.length})
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { data: session } = useSession();
  const { profile } = useProfile(); // เพิ่มการใช้ useProfile
  const {
    comments,
    pagination,
    isLoading,
    changePage,
    addComment,
    deleteComment,
    isCommentOwner,
    refreshComments
  } = useComments(postId);

  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // เพิ่ม state เพื่อเก็บข้อมูลโปรไฟล์ล่าสุด
  const [currentUserProfile, setCurrentUserProfile] = useState({
    name: profile?.name || session?.user?.name || "",
    image: profile?.image || session?.user?.image || null
  });

  // จัดกลุ่มคอมเมนต์และการตอบกลับ
  const [mainComments, setMainComments] = useState<Comment[]>([]);
  const [repliesByCommentId, setRepliesByCommentId] = useState<{ [key: string]: Comment[] }>({});

  // Modal สำหรับยืนยันการลบ
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onOpenDeleteModal,
    onOpenChange: onDeleteModalChange,
    onClose: onCloseDeleteModal
  } = useDisclosure();
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // อัปเดต currentUserProfile เมื่อ profile หรือ session เปลี่ยน
  useEffect(() => {
    if (profile || session?.user) {
      setCurrentUserProfile({
        name: profile?.name || session?.user?.name || "",
        image: profile?.image || session?.user?.image || null
      });
    }
  }, [profile, session]);

  // เพิ่ม useEffect เพื่อรับฟังเหตุการณ์เมื่อมีการอัปเดตโปรไฟล์
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        // อัปเดตข้อมูลโปรไฟล์ในหน้านี้ทันที
        setCurrentUserProfile({
          name: customEvent.detail.name || currentUserProfile.name,
          image: customEvent.detail.image
        });

        // รีเฟรชคอมเมนต์เพื่อให้แสดงข้อมูลล่าสุด
        refreshComments();
      }
    };

    // ลงทะเบียนรับฟังเหตุการณ์
    window.addEventListener('profile-updated', handleProfileUpdated);

    // เมื่อถอดคอมโพเนนต์ออก ให้เลิกรับฟังเหตุการณ์
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [refreshComments, currentUserProfile.name]);

  // แยกคอมเมนต์หลักและการตอบกลับ
  useEffect(() => {
    if (comments && comments.length > 0) {
      const mainCommentsList: Comment[] = [];
      const repliesMap: { [key: string]: Comment[] } = {};

      // จัดกลุ่มคอมเมนต์
      comments.forEach(comment => {
        if (!comment.parent_id) {
          // คอมเมนต์หลัก
          mainCommentsList.push(comment);
        } else {
          // คอมเมนต์ตอบกลับ
          if (!repliesMap[comment.parent_id]) {
            repliesMap[comment.parent_id] = [];
          }
          repliesMap[comment.parent_id].push(comment);
        }
      });

      // เรียงคอมเมนต์ตามเวลาล่าสุด
      mainCommentsList.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // เรียงการตอบกลับตามเวลา (เก่าไปใหม่)
      Object.keys(repliesMap).forEach(parentId => {
        repliesMap[parentId].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      setMainComments(mainCommentsList);
      setRepliesByCommentId(repliesMap);
    } else {
      setMainComments([]);
      setRepliesByCommentId({});
    }
  }, [comments]);

  // เริ่มการตอบกลับคอมเมนต์ (เฉพาะคอมเมนต์หลักเท่านั้น)
  const handleReply = (commentId: string) => {
    // ค้นหาคอมเมนต์จากคอมเมนต์หลักเท่านั้น
    const targetComment = mainComments.find(c => c._id === commentId);

    if (targetComment) {
      setReplyToId(commentId);
      setReplyTo(targetComment);
      setCommentText(`@${targetComment.user_name} `);

      // เลื่อนไปที่ text area
      const textareaElement = document.getElementById('comment-textarea');
      if (textareaElement) {
        textareaElement.focus();
        // เลื่อนไปที่ text area
        textareaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // ยกเลิกการตอบกลับ
  const cancelReply = () => {
    setReplyToId(null);
    setReplyTo(null);
    setCommentText("");
  };

  // เปิด modal ยืนยันการลบคอมเมนต์
  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    onOpenDeleteModal();
  };

  // ดำเนินการลบคอมเมนต์
  const confirmDelete = async () => {
    if (!commentToDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteComment(commentToDelete);

      if (!result.success) {
        setError(result.message || "ไม่สามารถลบความคิดเห็นได้");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("เกิดข้อผิดพลาดในการลบความคิดเห็น");
    } finally {
      setIsDeleting(false);
      onCloseDeleteModal();
      setCommentToDelete(null);
    }
  };

  // ส่งคอมเมนต์หรือการตอบกลับ
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
      const result = await addComment(commentText, replyToId || undefined);

      if (result.success) {
        setCommentText("");
        setReplyToId(null);
        setReplyTo(null);
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
            {replyTo && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md flex justify-between items-center">
                <span className="text-sm">
                  กำลังตอบคุณ <strong>{replyTo.user_name}</strong>
                </span>
                <Button
                  size="sm"
                  variant="light"
                  onPress={cancelReply}
                >
                  ยกเลิก
                </Button>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Avatar
                src={currentUserProfile.image || undefined}
                fallback={<FaUserCircle />}
                className="flex-shrink-0"
              />
              <Textarea
                id="comment-textarea"
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
            <Loading />
          </div>
        ) : mainComments.length > 0 ? (
          mainComments.map((comment: Comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              replies={repliesByCommentId[comment._id] || []}
              isOwner={isCommentOwner(comment)}
              onDelete={handleDeleteClick}
              onReply={handleReply}
              checkOwnership={isCommentOwner}
              session={session}
            />
          ))
        ) : (
          <p className="text-center py-4 text-zinc-500">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น</p>
        )}
      </div>

      {/* Modal ยืนยันการลบคอมเมนต์ */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={onDeleteModalChange} size="xs">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-danger">ยืนยันการลบความคิดเห็น</ModalHeader>
              <ModalBody>
                <p>คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?</p>
                <p className="text-sm text-zinc-500 mt-2">การลบความคิดเห็นไม่สามารถยกเลิกได้</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  color="danger"
                  onPress={confirmDelete}
                  isLoading={isDeleting}
                >
                  ลบความคิดเห็น
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={pagination.totalPages}
            initialPage={1}
            page={pagination.currentPage}
            onChange={changePage}
            color="primary"
            variant="light"
          />
        </div>
      )}
    </div>
  );
}