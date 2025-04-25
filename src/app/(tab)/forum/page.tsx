// src/app/forum/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Button,
  Card,
  CardBody,
  Pagination,
  Input,
  Chip,
  Select,
  SelectItem,
  Spinner,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Divider
} from "@heroui/react";
import {
  FaPlus,
  FaSearch,
  FaComments,
  FaEye,
  FaCalendarAlt,
  FaThumbtack
} from "react-icons/fa";
import { IoCreateOutline } from "react-icons/io5";
import Link from "next/link";
import { NavBar, Footer, Loading, PageHeader } from "@/components";
import { ForumPost, useForumPosts } from "@/hooks/useForumPosts";
import { showToast } from "@/lib/toast";
import { formatRelativeTime } from "@/lib/dateUtils";

// กำหนดประเภทกระทู้
const forumCategories: { label: string; value: string }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "คำถามทั่วไป", value: "general" },
  { label: "แนะนำสถานที่", value: "place" },
  { label: "รีวิวและประสบการณ์", value: "review" },
  { label: "แลกเปลี่ยนความรู้", value: "knowledge" },
  { label: "ประกาศ", value: "announcement" }
];

export default function ForumPage() {
  const { data: session, status } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showNewPostForm, setShowNewPostForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [postCategory, setPostCategory] = useState<string>("general");
  const [tags, setTags] = useState<string>("");

  const isAuthenticated = status === "authenticated" && session?.user;

  // โหลดข้อมูลกระทู้
  const {
    posts,
    pagination,
    isLoading,
    isSubmitting,
    isError,
    changePage,
    changeCategory,
    createPost,
    refreshPosts
  } = useForumPosts(selectedCategory);

  // Modal สำหรับการสร้างกระทู้
  const {
    isOpen: isCreateModalOpen,
    onOpen: onCreateModalOpen,
    onClose: onCreateModalClose,
    onOpenChange: onCreateModalOpenChange
  } = useDisclosure();

  // กรองข้อมูลกระทู้ตามการค้นหา
  const filteredPosts = searchTerm
    ? posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : posts;

  // เปลี่ยนหมวดหมู่ที่เลือก
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    changeCategory(value);
  };

  // สร้างกระทู้ใหม่
  const handleCreatePost = async () => {
    if (!title.trim()) {
      showToast("กรุณากรอกหัวข้อกระทู้", "error");
      return;
    }

    if (!content.trim()) {
      showToast("กรุณากรอกเนื้อหากระทู้", "error");
      return;
    }

    if (!postCategory) {
      showToast("กรุณาเลือกหมวดหมู่", "error");
      return;
    }

    // แปลง tags เป็น array
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    try {
      const result = await createPost({
        title,
        content,
        category: postCategory,
        tags: tagsArray
      });

      if (result.success) {
        // รีเซ็ตฟอร์ม
        setTitle("");
        setContent("");
        setPostCategory("general");
        setTags("");
        onCreateModalClose();
        
        // รีเฟรชข้อมูลกระทู้
        await refreshPosts();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // หากยังไม่มีการโหลดข้อมูล session
  if (status === "loading") {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">

      <PageHeader
        title="กระทู้"
        subtitle="พูดคุยแลกเปลี่ยน"
        description="พื้นที่สำหรับพูดคุยแลกเปลี่ยนความคิดเห็น ถามคำถาม และแบ่งปันประสบการณ์"
        imageSrc="https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=2070"
        imageAlt="กระทู้บางกระเจ้า"
        buttons={{
          primary: {
            text: "สร้างกระทู้ใหม่",
            href: "#",
            icon: <IoCreateOutline />
          }
        }}
      />

      <main className="flex-grow container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* ตัวกรองและการค้นหา */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select
                label="หมวดหมู่"
                placeholder="ทั้งหมด"
                selectedKeys={[selectedCategory]}
                onChange={(e) => handleCategoryChange(e.target.value)}
                size="sm"
                className="w-full sm:w-48"
              >
                {forumCategories.map((category) => (
                  <SelectItem key={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>

              <Input
                placeholder="ค้นหากระทู้..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                startContent={<FaSearch />}
                size="sm"
                className="w-full sm:w-60"
              />
            </div>

            <Button
              color="primary"
              startContent={<FaPlus />}
              isDisabled={!isAuthenticated}
              onPress={onCreateModalOpen}
              className="w-full sm:w-auto"
            >
              สร้างกระทู้ใหม่
            </Button>
          </div>

          {/* รายการกระทู้ */}
          <Card>
            <CardBody className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Spinner size="lg" color="primary" label="กำลังโหลดกระทู้..." />
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-20">
                  <FaComments size={40} className="mx-auto mb-4 text-default-400" />
                  <p className="text-default-500">ไม่พบกระทู้ที่คุณค้นหา</p>
                  {searchTerm && (
                    <Button
                      color="primary"
                      variant="flat"
                      className="mt-4"
                      onPress={() => setSearchTerm("")}
                    >
                      ล้างการค้นหา
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-default-200">
                  {filteredPosts.map((post) => (
                    <ForumPostItem key={post._id} post={post} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={pagination.totalPages}
                initialPage={pagination.currentPage}
                onChange={changePage}
                showControls
                color="primary"
              />
            </div>
          )}
        </div>
      </main>

      {/* Modal สร้างกระทู้ใหม่ */}
      <Modal
        isOpen={isCreateModalOpen}
        onOpenChange={onCreateModalOpenChange}
        size="xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl">สร้างกระทู้ใหม่</h2>
              </ModalHeader>
              <ModalBody>
                {!isAuthenticated ? (
                  <div className="text-center py-6">
                    <p className="mb-4">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถสร้างกระทู้ได้</p>
                    <Button
                      as={Link}
                      href="/login"
                      color="primary"
                    >
                      เข้าสู่ระบบ
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Input
                      label="หัวข้อกระทู้"
                      placeholder="กรอกหัวข้อกระทู้"
                      value={title}
                      onValueChange={setTitle}
                      variant="bordered"
                      isRequired
                    />

                    <Select
                      label="หมวดหมู่"
                      placeholder="เลือกหมวดหมู่"
                      selectedKeys={[postCategory]}
                      onChange={(e) => setPostCategory(e.target.value)}
                      variant="bordered"
                      isRequired
                    >
                      {forumCategories.filter(cat => cat.value !== "").map((category) => (
                        <SelectItem key={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </Select>

                    <Textarea
                      label="เนื้อหา"
                      placeholder="กรอกเนื้อหากระทู้"
                      value={content}
                      onValueChange={setContent}
                      variant="bordered"
                      minRows={5}
                      maxRows={10}
                      isRequired
                    />

                    <Input
                      label="แท็ก (คั่นด้วยเครื่องหมายจุลภาค)"
                      placeholder="กรอกแท็ก เช่น สถานที่ท่องเที่ยว, ที่พัก, อาหาร"
                      value={tags}
                      onValueChange={setTags}
                      variant="bordered"
                      description="แท็กช่วยให้ผู้อื่นค้นพบกระทู้ของคุณได้ง่ายขึ้น"
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  color="primary"
                  onPress={handleCreatePost}
                  isLoading={isSubmitting}
                  isDisabled={!isAuthenticated}
                >
                  {isSubmitting ? "กำลังสร้างกระทู้..." : "สร้างกระทู้"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}

interface ForumPostItemProps {
  post: ForumPost;
}

function ForumPostItem({ post }: ForumPostItemProps) {
  // แปลงประเภทกระทู้เป็นชื่อภาษาไทย
  const getCategoryLabel = (value: string): string => {
    const category = forumCategories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  return (
    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
      <Link href={`/forum/${post._id}`} className="block">
        <div className="flex items-start gap-3">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              {post.is_pinned && (
                <FaThumbtack className="text-danger text-sm" />
              )}
              <h3 className="text-lg font-semibold line-clamp-2">
                {post.title}
              </h3>
            </div>
            
            <p className="text-default-500 text-sm line-clamp-2 mb-2">
              {post.content}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <Chip color="primary" variant="flat" size="sm">
                {getCategoryLabel(post.category)}
              </Chip>
              
              {post.tags && post.tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} variant="flat" size="sm">
                  {tag}
                </Chip>
              ))}
              
              {post.tags && post.tags.length > 3 && (
                <Chip variant="flat" size="sm">+{post.tags.length - 3}</Chip>
              )}
            </div>
            
            <div className="flex items-center text-xs text-default-500 gap-4">
              <div className="flex items-center gap-1">
                <FaCalendarAlt size={12} />
                <span>{formatRelativeTime(post.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <FaEye size={12} />
                <span>{post.view_count} ครั้ง</span>
              </div>
              
              <span>โดย {post.user_name}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}