"use client";

// import React, { useState, useEffect, useCallback } from "react";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Pagination,
  Select,
  SelectItem,
  Tooltip,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Divider
} from "@heroui/react";
import {
  FaComments,
  FaSearch,
  FaThumbtack,
  FaTrash,
  FaEye,
  FaSyncAlt,
  FaExclamationTriangle
} from "react-icons/fa";
import Link from "next/link";
import { Loading } from "@/components";
import { AdminSidebar } from "@/components";
import { ForumPost, useForumPosts } from "@/hooks/useForumPosts";
import { useAdmin } from "@/hooks/useAdmin";
import { showToast } from "@/lib/toast";
import { formatRelativeTime, formatDateTime } from "@/lib/dateUtils";

// กำหนดประเภทกระทู้
const forumCategories: { label: string; value: string }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "คำถามทั่วไป", value: "general" },
  { label: "แนะนำสถานที่", value: "place" },
  { label: "รีวิวและประสบการณ์", value: "review" },
  { label: "แลกเปลี่ยนความรู้", value: "knowledge" },
  { label: "ประกาศ", value: "announcement" }
];

export default function AdminForumPage() {
  const router = useRouter();
  const { status } = useSession();
  const { isAdmin, isSuperAdmin, isLoading: isLoadingAdmin } = useAdmin();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // โหลดข้อมูลกระทู้
  const {
    posts,
    pagination,
    isLoading,
    togglePin,
    deletePost,
    changeCategory,
    changePage,
    refreshPosts
  } = useForumPosts(selectedCategory);

  // Modal ยืนยันการลบกระทู้
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpenChange: onDeleteModalOpenChange
  } = useDisclosure();

  // ตรวจสอบสิทธิ์การเข้าถึงหน้านี้
  useEffect(() => {
    if (status === "authenticated" && !isLoadingAdmin) {
      if (!isAdmin) {
        showToast("คุณไม่มีสิทธิ์เข้าถึงหน้านี้", "error");
        router.push("/");
      }
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, isAdmin, isLoadingAdmin, router]);

  // กรองข้อมูลกระทู้ตามการค้นหา
  const filteredPosts = searchTerm
    ? posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags && post.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    : posts;

  // เปลี่ยนหมวดหมู่ที่เลือก
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    changeCategory(value);
  };

  // สลับการปักหมุดกระทู้
  const handleTogglePin = async (post: ForumPost) => {
    try {
      const result = await togglePin(post._id, !post.is_pinned);
      if (result.success) {
        showToast(
          post.is_pinned ? "ยกเลิกการปักหมุดกระทู้เรียบร้อยแล้ว" : "ปักหมุดกระทู้เรียบร้อยแล้ว",
          "success"
        );
      }
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  // ลบกระทู้
  const handleDeletePost = async () => {
    if (!selectedPost) return;

    try {
      const result = await deletePost(selectedPost._id);
      if (result.success) {
        showToast("ลบกระทู้เรียบร้อยแล้ว", "success");
        onDeleteModalClose();
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // รีเฟรชข้อมูลกระทู้
  const handleRefreshPosts = async () => {
    setIsRefreshing(true);
    try {
      await refreshPosts();
      showToast("รีเฟรชข้อมูลกระทู้เรียบร้อยแล้ว", "success");
    } catch (error) {
      console.error("Error refreshing posts:", error);
      showToast("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // แปลงหมวดหมู่เป็นชื่อภาษาไทย
  const getCategoryLabel = (value: string): string => {
    const category = forumCategories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  if (status === "loading" || isLoadingAdmin) {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-20">
            <FaExclamationTriangle size={50} className="text-danger mb-4" />
            <h2 className="text-2xl font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-default-500 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
            <Button color="primary" onPress={() => router.push("/")}>
              กลับไปยังหน้าหลัก
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar isSuperAdmin={isSuperAdmin} />
      
      <div className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FaComments className="text-primary" />
                จัดการกระทู้
              </h1>
              <p className="text-default-500">จัดการกระทู้ ปักหมุด และลบกระทู้ที่ไม่เหมาะสม</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                color="default" 
                onPress={handleRefreshPosts}
                isLoading={isRefreshing}
                startContent={!isRefreshing && <FaSyncAlt />}
              >
                {isRefreshing ? "กำลังโหลด..." : "รีเฟรช"}
              </Button>
              
              <Button 
                as={Link}
                href="/forum"
                color="primary" 
                target="_blank"
              >
                ไปยังหน้ากระทู้
              </Button>
            </div>
          </div>

          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
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
                
                <div className="text-sm text-default-500">
                  พบ {filteredPosts.length} รายการ จากทั้งหมด {posts.length} รายการ
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner label="กำลังโหลดข้อมูล..." color="primary" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-10">
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
                <>
                  <Table aria-label="รายการกระทู้">
                    <TableHeader>
                      <TableColumn>กระทู้</TableColumn>
                      <TableColumn>หมวดหมู่</TableColumn>
                      <TableColumn>ผู้โพสต์</TableColumn>
                      <TableColumn>วันที่โพสต์</TableColumn>
                      <TableColumn>การเข้าชม</TableColumn>
                      <TableColumn>การจัดการ</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.map((post) => (
                        <TableRow key={post._id}>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              {post.is_pinned && (
                                <FaThumbtack className="text-primary-color mt-1 flex-shrink-0" />
                              )}
                              <div>
                                <p className="font-medium line-clamp-1">{post.title}</p>
                                <p className="text-tiny text-default-500 line-clamp-1">{post.content}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip size="sm" variant="flat">
                              {getCategoryLabel(post.category)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{post.user_name}</span>
                              <span className="text-tiny text-default-500">{post.user_bkc_id.substring(0, 8)}...</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tooltip content={formatDateTime(post.createdAt)}>
                              <span>{formatRelativeTime(post.createdAt)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FaEye size={14} />
                              <span>{post.view_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Tooltip content={post.is_pinned ? "ยกเลิกการปักหมุด" : "ปักหมุดกระทู้"}>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color={post.is_pinned ? "primary" : "default"}
                                  variant={post.is_pinned ? "solid" : "bordered"}
                                  onPress={() => handleTogglePin(post)}
                                >
                                  <FaThumbtack />
                                </Button>
                              </Tooltip>
                              
                              <Tooltip content="ลบกระทู้">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  onPress={() => {
                                    setSelectedPost(post);
                                    onDeleteModalOpen();
                                  }}
                                >
                                  <FaTrash />
                                </Button>
                              </Tooltip>
                              
                              <Tooltip content="ดูกระทู้">
                                <Button
                                  as={Link}
                                  href={`/forum/${post._id}`}
                                  target="_blank"
                                  isIconOnly
                                  size="sm"
                                  color="default"
                                  variant="light"
                                >
                                  <FaEye />
                                </Button>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
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
                </>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Modal ยืนยันการลบกระทู้ */}
        <Modal 
          isOpen={isDeleteModalOpen} 
          onOpenChange={onDeleteModalOpenChange}
          backdrop="blur"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-danger">
                    <FaExclamationTriangle />
                    <span>ยืนยันการลบกระทู้</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  {selectedPost && (
                    <>
                      <p>คุณกำลังจะลบกระทู้:</p>
                      <p className="font-semibold">{selectedPost.title}</p>
                      <p className="text-sm text-default-500 mt-2">โพสต์โดย: {selectedPost.user_name}</p>
                      <Divider className="my-2" />
                      <p className="text-danger">การลบกระทู้จะไม่สามารถกู้คืนได้ และการตอบกลับทั้งหมดจะถูกลบด้วย</p>
                    </>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleDeletePost}
                  >
                    ลบกระทู้
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}