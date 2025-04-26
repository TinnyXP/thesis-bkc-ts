// src/app/forum/[id]/page.tsx
"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
// import { useParams, useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  Avatar,
  AvatarIcon,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Pagination,
  Textarea,
  Tooltip,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheck,
  FaEye,
  FaPen,
  FaReply,
  FaTrash,
  FaCheckCircle,
  FaTimes
} from "react-icons/fa";
import Link from "next/link";
import { Loading } from "@/components";
// import { ForumPost } from "@/hooks/useForumPosts";
import { ForumReply, useForumPostDetail } from "@/hooks/useForumPostDetail";
import { showToast } from "@/lib/toast";
import { formatRelativeTime } from "@/lib/dateUtils";

// กำหนดประเภทกระทู้
const forumCategories: { label: string; value: string }[] = [
  { label: "คำถามทั่วไป", value: "general" },
  { label: "แนะนำสถานที่", value: "place" },
  { label: "รีวิวและประสบการณ์", value: "review" },
  { label: "แลกเปลี่ยนความรู้", value: "knowledge" },
  { label: "ประกาศ", value: "announcement" }
];

export default function ForumDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  // const router = useRouter();
  const postId = params.id as string;
  const [replyContent, setReplyContent] = useState<string>("");
  const [editingReply, setEditingReply] = useState<ForumReply | null>(null);
  const [editReplyContent, setEditReplyContent] = useState<string>("");
  const [selectedReply, setSelectedReply] = useState<ForumReply | null>(null);

  const isAuthenticated = status === "authenticated" && session?.user;

  // ข้อมูลกระทู้และการตอบกลับ
  const {
    post,
    replies,
    repliesPagination,
    isLoadingPost,
    isLoadingReplies,
    isSubmittingReply,
    isUpdating,
    isErrorPost,
    currentRepliesPage,
    changeRepliesPage,
    addReply,
    editReply,
    deleteReply,
    markAsSolution,
    refreshReplies
  } = useForumPostDetail(postId);

  // const {
  //   post,
  //   replies,
  //   repliesPagination,
  //   isLoadingPost,
  //   isLoadingReplies,
  //   isSubmittingReply,
  //   isUpdating,
  //   isErrorPost,
  //   isErrorReplies,
  //   currentRepliesPage,
  //   changeRepliesPage,
  //   addReply,
  //   editReply,
  //   deleteReply,
  //   markAsSolution,
  //   refreshPost,
  //   refreshReplies
  // } = useForumPostDetail(postId);

  // Modal ยืนยันการลบการตอบกลับ
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpenChange: onDeleteModalOpenChange
  } = useDisclosure();

  // // สถานะการโหลดรูปโปรไฟล์
  // const [loadingAvatar, setLoadingAvatar] = useState<{ [key: string]: boolean }>({});

  // การส่งคำตอบ
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      showToast("กรุณากรอกข้อความตอบกลับ", "error");
      return;
    }

    try {
      const result = await addReply(replyContent);
      if (result.success) {
        setReplyContent("");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  // การตั้งค่าการแก้ไขคำตอบ
  const handleSetEditingReply = (reply: ForumReply) => {
    setEditingReply(reply);
    setEditReplyContent(reply.content);
  };

  // การบันทึกการแก้ไขคำตอบ
  const handleSaveEdit = async () => {
    if (!editingReply) return;
    if (!editReplyContent.trim()) {
      showToast("กรุณากรอกข้อความตอบกลับ", "error");
      return;
    }

    try {
      const result = await editReply(editingReply._id, editReplyContent);
      if (result.success) {
        setEditingReply(null);
        setEditReplyContent("");
      }
    } catch (error) {
      console.error("Error editing reply:", error);
    }
  };

  // การยกเลิกการแก้ไขคำตอบ
  const handleCancelEdit = () => {
    setEditingReply(null);
    setEditReplyContent("");
  };

  // การลบคำตอบ
  const handleDeleteReply = async () => {
    if (!selectedReply) return;

    try {
      const result = await deleteReply(selectedReply._id);
      if (result.success) {
        onDeleteModalClose();
        setSelectedReply(null);
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
    }
  };

  // การทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง
  const handleMarkAsSolution = async (reply: ForumReply) => {
    try {
      const result = await markAsSolution(reply._id, !reply.is_solution);
      if (result.success) {
        refreshReplies();
      }
    } catch (error) {
      console.error("Error marking as solution:", error);
    }
  };

  // แปลงประเภทกระทู้เป็นชื่อภาษาไทย
  const getCategoryLabel = (value: string): string => {
    const category = forumCategories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  // ตรวจสอบว่าผู้ใช้เป็นเจ้าของกระทู้หรือไม่
  const isPostOwner = (): boolean => {
    if (!session?.user || !post) return false;
    return session.user.bkcId === post.user_bkc_id;
  };

  // ตรวจสอบว่าผู้ใช้เป็นเจ้าของคำตอบหรือไม่
  const isReplyOwner = (reply: ForumReply): boolean => {
    if (!session?.user) return false;
    return session.user.bkcId === reply.user_bkc_id;
  };

  // หากยังไม่มีการโหลดข้อมูล session
  if (status === "loading" || isLoadingPost) {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen={true} />;
  }

  // กรณีไม่พบกระทู้
  if (isErrorPost || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
        <main className="flex-grow container mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-12">
              <h1 className="text-2xl font-bold mb-4">ไม่พบกระทู้</h1>
              <p className="text-default-500 mb-6">กระทู้นี้อาจถูกลบไปแล้ว หรือคุณอาจเข้าถึง URL ที่ไม่ถูกต้อง</p>
              <Button
                as={Link}
                href="/forum"
                color="primary"
                startContent={<FaArrowLeft />}
              >
                กลับไปยังหน้ากระทู้
              </Button>
            </CardBody>
          </Card>
        </main>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">

      <main className="flex-grow container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-default-500">
            <Link href="/" className="hover:text-primary-color">หน้าหลัก</Link>
            <span>/</span>
            <Link href="/forum" className="hover:text-primary-color">กระทู้</Link>
            <span>/</span>
            <span className="text-default-700 truncate max-w-[300px]">{post.title}</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* กระทู้หลัก */}
          <Card>
            <CardHeader className="flex flex-col items-start gap-2 pb-0">
              <div className="w-full flex items-center justify-between flex-wrap gap-2">
                <Chip color="primary" variant="flat">
                  {getCategoryLabel(post.category)}
                </Chip>
                
                <div className="flex items-center gap-2 text-sm text-default-500">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt size={12} />
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <FaEye size={12} />
                    <span>{post.view_count} ครั้ง</span>
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold">{post.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {post.tags && post.tags.map((tag, index) => (
                  <Chip key={index} variant="flat" size="sm">
                    {tag}
                  </Chip>
                ))}
              </div>
            </CardHeader>
            
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Avatar
                    icon={<AvatarIcon />}
                    src={post.user_image || undefined}
                    showFallback
                    className="w-10 h-10"
                  />
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{post.user_name}</span>
                    <span className="text-xs text-default-500">เจ้าของกระทู้</span>
                  </div>
                  
                  <div className="mt-4 whitespace-pre-wrap break-words">
                    {post.content}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* จำนวนคำตอบ */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              คำตอบ ({repliesPagination?.totalItems || 0})
            </h2>
            
            {repliesPagination && repliesPagination.totalPages > 1 && (
              <Pagination
                total={repliesPagination.totalPages}
                initialPage={currentRepliesPage}
                onChange={changeRepliesPage}
                size="sm"
              />
            )}
          </div>

          {/* รายการคำตอบ */}
          {isLoadingReplies ? (
            <Loading message="กำลังโหลดคำตอบ..." />
          ) : replies.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-default-500 mb-4">ยังไม่มีคำตอบในกระทู้นี้</p>
                {isAuthenticated ? (
                  <p className="text-sm">เป็นคนแรกที่ตอบกระทู้นี้!</p>
                ) : (
                  <Button
                    as={Link}
                    href="/login"
                    color="primary"
                    variant="flat"
                  >
                    เข้าสู่ระบบเพื่อตอบกระทู้
                  </Button>
                )}
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {replies.map((reply) => (
                <Card key={reply._id} className={reply.is_solution ? "border-2 border-success" : undefined}>
                  {reply.is_solution && (
                    <div className="px-4 py-2 bg-success/10 flex items-center gap-2">
                      <FaCheckCircle className="text-success" />
                      <span className="text-success font-medium">คำตอบที่ได้รับการยอมรับ</span>
                    </div>
                  )}
                  
                  <CardBody>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Avatar
                          icon={<AvatarIcon />}
                          src={reply.user_image || undefined}
                          showFallback
                          className="w-10 h-10"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{reply.user_name}</span>
                          <span className="text-xs text-default-500">{formatRelativeTime(reply.createdAt)}</span>
                        </div>
                        
                        {editingReply && editingReply._id === reply._id ? (
                          <div className="mt-2">
                            <Textarea
                              value={editReplyContent}
                              onValueChange={setEditReplyContent}
                              minRows={3}
                              maxRows={10}
                              className="mb-2"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={handleCancelEdit}
                                startContent={<FaTimes />}
                              >
                                ยกเลิก
                              </Button>
                              <Button
                                size="sm"
                                color="primary"
                                onPress={handleSaveEdit}
                                isLoading={isUpdating}
                                startContent={!isUpdating && <FaCheck />}
                              >
                                บันทึก
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 whitespace-pre-wrap break-words">
                            {reply.content}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                  
                  <CardFooter className="flex justify-end gap-2">
                    {/* ปุ่มทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง - แสดงเฉพาะเจ้าของกระทู้ */}
                    {isPostOwner() && reply.user_bkc_id !== session?.user?.bkcId && (
                      <Tooltip content={reply.is_solution ? "ยกเลิกการทำเครื่องหมาย" : "ทำเครื่องหมายว่าเป็นคำตอบที่ถูกต้อง"}>
                        <Button
                          size="sm"
                          color={reply.is_solution ? "success" : "default"}
                          variant={reply.is_solution ? "solid" : "bordered"}
                          isIconOnly
                          onPress={() => handleMarkAsSolution(reply)}
                        >
                          <FaCheck />
                        </Button>
                      </Tooltip>
                    )}
                    
                    {/* ปุ่มแก้ไข - แสดงเฉพาะเจ้าของคำตอบ */}
                    {isReplyOwner(reply) && !editingReply && (
                      <Tooltip content="แก้ไข">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => handleSetEditingReply(reply)}
                        >
                          <FaPen />
                        </Button>
                      </Tooltip>
                    )}
                    
                    {/* ปุ่มลบ - แสดงเฉพาะเจ้าของคำตอบ */}
                    {isReplyOwner(reply) && !editingReply && (
                      <Tooltip content="ลบ">
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          isIconOnly
                          onPress={() => {
                            setSelectedReply(reply);
                            onDeleteModalOpen();
                          }}
                        >
                          <FaTrash />
                        </Button>
                      </Tooltip>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* ฟอร์มสำหรับการตอบกระทู้ */}
          {isAuthenticated ? (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">ตอบกระทู้</h3>
              </CardHeader>
              <CardBody>
                <Textarea
                  placeholder="พิมพ์คำตอบของคุณที่นี่..."
                  value={replyContent}
                  onValueChange={setReplyContent}
                  minRows={3}
                  maxRows={10}
                />
              </CardBody>
              <CardFooter>
                <Button
                  color="primary"
                  onPress={handleSubmitReply}
                  isLoading={isSubmittingReply}
                  startContent={!isSubmittingReply && <FaReply />}
                >
                  {isSubmittingReply ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardBody className="text-center py-6">
                <p className="text-default-500 mb-4">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถตอบกระทู้ได้</p>
                <Button
                  as={Link}
                  href="/login"
                  color="primary"
                >
                  เข้าสู่ระบบเพื่อตอบกระทู้
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </main>

      {/* Modal ยืนยันการลบคำตอบ */}
      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={onDeleteModalOpenChange}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl text-danger">ยืนยันการลบคำตอบ</h2>
              </ModalHeader>
              <ModalBody>
                <p>คุณแน่ใจหรือไม่ว่าต้องการลบคำตอบนี้?</p>
                <p className="text-danger">การกระทำนี้ไม่สามารถเรียกคืนได้</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteReply}
                  isLoading={isUpdating}
                >
                  ลบคำตอบ
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}