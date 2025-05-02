// src/app/(tab)/community/page.tsx (แก้ไข)
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Select,
  SelectItem,
  Pagination,
  Tabs,
  Tab,
  Spinner,
  useDisclosure
} from "@heroui/react";
import {
  FaClipboardList,
  FaSearch,
  FaPlus,
  FaEye,
  FaCalendarAlt,
  FaComments,
  FaThumbtack,
  FaSyncAlt
} from "react-icons/fa";
import Link from "next/link";
import { Loading, PageHeader, CreateForumModal, CreateComplaintModal } from "@/components";
import { ForumPost, useForumPosts } from "@/hooks/useForumPosts";
import { Complaint, useComplaints } from "@/hooks/useComplaints";
import { showToast } from "@/lib/toast";
import { formatRelativeTime } from "@/lib/dateUtils";

// กระทู้: ประเภทกระทู้
const forumCategories: { label: string; value: string }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "คำถามทั่วไป", value: "general" },
  { label: "แนะนำสถานที่", value: "place" },
  { label: "รีวิวและประสบการณ์", value: "review" },
  { label: "แลกเปลี่ยนความรู้", value: "knowledge" },
  { label: "ประกาศ", value: "announcement" }
];

// เรื่องร้องเรียน: ประเภทเรื่องร้องเรียน
const complaintCategories: { label: string; value: string }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "บริการ", value: "service" },
  { label: "สถานที่", value: "place" },
  { label: "ความปลอดภัย", value: "safety" },
  { label: "สิ่งแวดล้อม", value: "environment" },
  { label: "อื่นๆ", value: "other" }
];

// เรื่องร้องเรียน: สถานะเรื่องร้องเรียน
const complaintStatuses: { label: string; value: string }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "รอดำเนินการ", value: "pending" },
  { label: "กำลังดำเนินการ", value: "inprogress" },
  { label: "แก้ไขแล้ว", value: "resolved" },
  { label: "ไม่อนุมัติ", value: "rejected" }
];

// Component หลัก
export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("forum");

  // State สำหรับ Forum
  const [forumCategory, setForumCategory] = useState<string>("");
  const [forumSearchTerm, setForumSearchTerm] = useState<string>("");
  const [isRefreshingForum, setIsRefreshingForum] = useState<boolean>(false);

  // State สำหรับ Complaints
  const [complaintCategory, setComplaintCategory] = useState<string>("");
  const [complaintStatus, setComplaintStatus] = useState<"" | "pending" | "inprogress" | "resolved" | "rejected">("");
  const [complaintSearchTerm, setComplaintSearchTerm] = useState<string>("");
  const [isRefreshingComplaints, setIsRefreshingComplaints] = useState<boolean>(false);

  // Modal สำหรับสร้างกระทู้
  const {
    isOpen: isCreateForumOpen,
    onOpen: onCreateForumOpen,
    onClose: onCreateForumClose,
    onOpenChange: onCreateForumOpenChange
  } = useDisclosure();

  // Modal สำหรับสร้างเรื่องร้องเรียน
  const {
    isOpen: isCreateComplaintOpen,
    onOpen: onCreateComplaintOpen,
    onClose: onCreateComplaintClose,
    onOpenChange: onCreateComplaintOpenChange
  } = useDisclosure();

  useEffect(() => {
    // ใช้ searchParams จาก next/navigation ตรวจสอบ tab
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');

    // ถ้าไม่มี tab หรือ tab ไม่ถูกต้อง ให้ตั้งค่าเริ่มต้นเป็น 'forum'
    if (!tabParam || (tabParam !== 'forum' && tabParam !== 'complaints')) {
      setActiveTab('forum');

      // ปรับ URL โดยไม่รีโหลดหน้า
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', 'forum');
      window.history.replaceState({}, '', newUrl);
    } else {
      // ถ้ามี tab ที่ถูกต้องแล้ว ให้ใช้ค่านั้น
      setActiveTab(tabParam);
    }
  }, []);

  // เมื่อเปลี่ยน tab อัปเดต URL โดยไม่รีโหลดหน้า
  useEffect(() => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', newUrl);
  }, [activeTab]);

  // ใช้ hooks ที่มีอยู่แล้ว
  const {
    posts,
    pagination: forumPagination,
    isLoading: isLoadingForum,
    changePage: changeForumPage,
    changeCategory: changeForumCategory,
    refreshPosts
  } = useForumPosts(forumCategory);

  const {
    complaints,
    pagination: complaintPagination,
    isLoading: isLoadingComplaints,
    changeStatus,
    changeCategory: changeComplaintCategory,
    changePage: changeComplaintPage,
    refreshComplaints
  } = useComplaints(complaintStatus, complaintCategory);

  const isAuthenticated = status === "authenticated" && session?.user;

  // กรองข้อมูลกระทู้ตามการค้นหา
  const filteredPosts = forumSearchTerm
    ? posts.filter(post =>
      post.title.toLowerCase().includes(forumSearchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(forumSearchTerm.toLowerCase()) ||
      (post.tags && post.tags.some(tag =>
        tag.toLowerCase().includes(forumSearchTerm.toLowerCase())
      ))
    )
    : posts;

  // กรองข้อมูลเรื่องร้องเรียนตามการค้นหา
  const filteredComplaints = complaintSearchTerm
    ? complaints.filter(complaint =>
      complaint.title.toLowerCase().includes(complaintSearchTerm.toLowerCase()) ||
      complaint.content.toLowerCase().includes(complaintSearchTerm.toLowerCase()) ||
      (complaint.tags && complaint.tags.some(tag =>
        tag.toLowerCase().includes(complaintSearchTerm.toLowerCase())
      ))
    )
    : complaints;

  // ฟังก์ชันเปลี่ยนหมวดหมู่กระทู้
  const handleForumCategoryChange = (value: string) => {
    setForumCategory(value);
    changeForumCategory(value);
  };

  // ฟังก์ชันเปลี่ยนหมวดหมู่เรื่องร้องเรียน
  const handleComplaintCategoryChange = (value: string) => {
    setComplaintCategory(value);
    changeComplaintCategory(value);
  };

  // ฟังก์ชันเปลี่ยนสถานะเรื่องร้องเรียน
  const handleComplaintStatusChange = (value: string) => {
    const newStatus = value as "" | "pending" | "inprogress" | "resolved" | "rejected";
    setComplaintStatus(newStatus);
    changeStatus(newStatus);
  };

  // ฟังก์ชันรีเฟรชข้อมูลกระทู้
  const handleRefreshForum = async () => {
    setIsRefreshingForum(true);
    try {
      await refreshPosts();
      showToast("รีเฟรชข้อมูลกระทู้เรียบร้อยแล้ว", "success");
    } catch (error) {
      console.error("Error refreshing forum posts:", error);
      showToast("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล", "error");
    } finally {
      setIsRefreshingForum(false);
    }
  };

  // ฟังก์ชันรีเฟรชข้อมูลเรื่องร้องเรียน
  const handleRefreshComplaints = async () => {
    setIsRefreshingComplaints(true);
    try {
      await refreshComplaints();
      showToast("รีเฟรชข้อมูลเรื่องร้องเรียนเรียบร้อยแล้ว", "success");
    } catch (error) {
      console.error("Error refreshing complaints:", error);
      showToast("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล", "error");
    } finally {
      setIsRefreshingComplaints(false);
    }
  };

  // เมื่อสร้างกระทู้หรือเรื่องร้องเรียนสำเร็จ ให้รีเฟรชข้อมูล
  const handleForumCreated = () => {
    refreshPosts();
  };

  const handleComplaintCreated = () => {
    refreshComplaints();
  };

  // แปลงหมวดหมู่กระทู้เป็นชื่อภาษาไทย
  const getForumCategoryLabel = (value: string): string => {
    const category = forumCategories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  // แปลงหมวดหมู่เรื่องร้องเรียนเป็นชื่อภาษาไทย
  const getComplaintCategoryLabel = (value: string): string => {
    const category = complaintCategories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  // แปลงสถานะเรื่องร้องเรียนเป็นชื่อภาษาไทย
  const getComplaintStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return "รอดำเนินการ";
      case 'inprogress': return "กำลังดำเนินการ";
      case 'resolved': return "แก้ไขแล้ว";
      case 'rejected': return "ไม่อนุมัติ";
      default: return status;
    }
  };

  // แปลงสถานะเป็นสี
  const getComplaintStatusColor = (status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (status) {
      case 'pending': return "warning";
      case 'inprogress': return "primary";
      case 'resolved': return "success";
      case 'rejected': return "danger";
      default: return "default";
    }
  };

  // เช็คว่าต้องล็อกอินก่อนไหม
  const handleCreateButtonClick = (type: 'forum' | 'complaint') => {
    if (!isAuthenticated) {
      showToast("กรุณาเข้าสู่ระบบก่อนสร้าง" + (type === 'forum' ? "กระทู้" : "เรื่องร้องเรียน"), "error");
      router.push('/login');
      return;
    }

    if (type === 'forum') {
      onCreateForumOpen();
    } else {
      onCreateComplaintOpen();
    }
  };

  if (status === "loading") {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      <PageHeader
        title="ชุมชนบางกระเจ้า"
        subtitle="พูดคุยและแจ้งปัญหา"
        description="พื้นที่สำหรับพูดคุยแลกเปลี่ยน ถามคำถาม แบ่งปันประสบการณ์ และแจ้งปัญหาเกี่ยวกับบางกระเจ้า"
        imageSrc="https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=2070"
        imageAlt="ชุมชนบางกระเจ้า"
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            color={activeTab === "forum" ? "primary" : "default"}
            variant={activeTab === "forum" ? "solid" : "bordered"}
            className="bg-white/10 backdrop-blur-sm font-semibold text-white"
            startContent={<FaComments />}
            onPress={() => setActiveTab("forum")}
          >
            กระทู้
          </Button>
          <Button
            color={activeTab === "complaints" ? "primary" : "default"}
            variant={activeTab === "complaints" ? "solid" : "bordered"}
            className="bg-white/10 backdrop-blur-sm font-semibold text-white"
            startContent={<FaClipboardList />}
            onPress={() => setActiveTab("complaints")}
          >
            เรื่องร้องเรียน
          </Button>
        </div>
      </PageHeader>

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        <Tabs
          aria-label="ประเภทเนื้อหา"
          color="primary"
          variant="underlined"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          classNames={{
            tabList: "gap-6",
            cursor: "bg-primary-color",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary-color"
          }}
        >
          {/* ส่วนแสดงกระทู้ */}
          <Tab
            key="forum"
            title={
              <div className="flex items-center gap-2">
                <FaComments />
                <span>กระทู้</span>
              </div>
            }
          >
            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Select
                    label="หมวดหมู่"
                    placeholder="ทั้งหมด"
                    selectedKeys={[forumCategory]}
                    onChange={(e) => handleForumCategoryChange(e.target.value)}
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
                    value={forumSearchTerm}
                    onValueChange={setForumSearchTerm}
                    startContent={<FaSearch />}
                    size="sm"
                    className="w-full sm:w-60"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    color="default"
                    onPress={handleRefreshForum}
                    isLoading={isRefreshingForum}
                    startContent={!isRefreshingForum && <FaSyncAlt />}
                    className="flex-1 sm:flex-none"
                  >
                    {isRefreshingForum ? "กำลังโหลด..." : "รีเฟรช"}
                  </Button>

                  <Button
                    color="primary"
                    startContent={<FaPlus />}
                    className="flex-1 sm:flex-none"
                    onPress={() => handleCreateButtonClick('forum')}
                  >
                    สร้างกระทู้ใหม่
                  </Button>
                </div>
              </div>

              <Card>
                <CardBody className="p-0">
                  {isLoadingForum ? (
                    <div className="flex justify-center items-center py-20">
                      <Spinner size="lg" color="primary" label="กำลังโหลดกระทู้..." />
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20">
                      <FaComments size={40} className="mx-auto mb-4 text-default-400" />
                      <p className="text-default-500">ไม่พบกระทู้ที่คุณค้นหา</p>
                      {forumSearchTerm && (
                        <Button
                          color="primary"
                          variant="flat"
                          className="mt-4"
                          onPress={() => setForumSearchTerm("")}
                        >
                          ล้างการค้นหา
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-default-200">
                      {filteredPosts.map((post) => (
                        <ForumPostItem
                          key={post._id}
                          post={post}
                          getCategoryLabel={getForumCategoryLabel}
                        />
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Pagination สำหรับกระทู้ */}
              {forumPagination && forumPagination.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    total={forumPagination.totalPages}
                    initialPage={forumPagination.currentPage}
                    onChange={changeForumPage}
                    showControls
                    color="primary"
                  />
                </div>
              )}
            </div>
          </Tab>

          {/* ส่วนแสดงเรื่องร้องเรียน */}
          <Tab
            key="complaints"
            title={
              <div className="flex items-center gap-2">
                <FaClipboardList />
                <span>เรื่องร้องเรียน</span>
              </div>
            }
          >
            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Select
                    label="หมวดหมู่"
                    placeholder="ทั้งหมด"
                    selectedKeys={[complaintCategory]}
                    onChange={(e) => handleComplaintCategoryChange(e.target.value)}
                    size="sm"
                    className="w-full sm:w-40"
                  >
                    {complaintCategories.map((category) => (
                      <SelectItem key={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="สถานะ"
                    placeholder="ทั้งหมด"
                    selectedKeys={[complaintStatus]}
                    onChange={(e) => handleComplaintStatusChange(e.target.value)}
                    size="sm"
                    className="w-full sm:w-40"
                  >
                    {complaintStatuses.map((status) => (
                      <SelectItem key={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    placeholder="ค้นหาเรื่องร้องเรียน..."
                    value={complaintSearchTerm}
                    onValueChange={setComplaintSearchTerm}
                    startContent={<FaSearch />}
                    size="sm"
                    className="w-full sm:w-60"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    color="default"
                    onPress={handleRefreshComplaints}
                    isLoading={isRefreshingComplaints}
                    startContent={!isRefreshingComplaints && <FaSyncAlt />}
                    className="flex-1 sm:flex-none"
                  >
                    {isRefreshingComplaints ? "กำลังโหลด..." : "รีเฟรช"}
                  </Button>

                  <Button
                    color="primary"
                    startContent={<FaPlus />}
                    className="flex-1 sm:flex-none"
                    onPress={() => handleCreateButtonClick('complaint')}
                  >
                    สร้างเรื่องร้องเรียนใหม่
                  </Button>
                </div>
              </div>

              <Card>
                <CardBody className="p-0">
                  {isLoadingComplaints ? (
                    <div className="flex justify-center items-center py-20">
                      <Spinner size="lg" color="primary" label="กำลังโหลดเรื่องร้องเรียน..." />
                    </div>
                  ) : filteredComplaints.length === 0 ? (
                    <div className="text-center py-20">
                      <FaClipboardList size={40} className="mx-auto mb-4 text-default-400" />
                      <p className="text-default-500">ไม่พบเรื่องร้องเรียนที่คุณค้นหา</p>
                      {complaintSearchTerm && (
                        <Button
                          color="primary"
                          variant="flat"
                          className="mt-4"
                          onPress={() => setComplaintSearchTerm("")}
                        >
                          ล้างการค้นหา
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-default-200">
                      {filteredComplaints.map((complaint) => (
                        <ComplaintItem
                          key={complaint._id}
                          complaint={complaint}
                          getCategoryLabel={getComplaintCategoryLabel}
                          getStatusText={getComplaintStatusText}
                          getStatusColor={getComplaintStatusColor}
                        />
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Pagination สำหรับเรื่องร้องเรียน */}
              {complaintPagination && complaintPagination.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    total={complaintPagination.totalPages}
                    initialPage={complaintPagination.currentPage}
                    onChange={changeComplaintPage}
                    showControls
                    color="primary"
                  />
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </main>

      {/* Modal สร้างกระทู้ */}
      <CreateForumModal
        isOpen={isCreateForumOpen}
        onOpenChange={onCreateForumOpenChange}
        onCreated={handleForumCreated}
      />

      {/* Modal สร้างเรื่องร้องเรียน */}
      <CreateComplaintModal
        isOpen={isCreateComplaintOpen}
        onOpenChange={onCreateComplaintOpenChange}
        onCreated={handleComplaintCreated}
      />
    </div>
  );
}

// Component แสดงกระทู้แต่ละรายการ
interface ForumPostItemProps {
  post: ForumPost;
  getCategoryLabel: (value: string) => string;
}

function ForumPostItem({ post, getCategoryLabel }: ForumPostItemProps) {
  return (
    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
      <Link href={`/community/forum/${post._id}`} className="block">
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

// Component แสดงเรื่องร้องเรียนแต่ละรายการ
interface ComplaintItemProps {
  complaint: Complaint;
  getCategoryLabel: (value: string) => string;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

function ComplaintItem({ complaint, getCategoryLabel, getStatusText, getStatusColor }: ComplaintItemProps) {
  return (
    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
      <Link href={`/community/complaint/${complaint._id}`} className="block">
        <div className="flex items-start gap-3">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold line-clamp-2">
                {complaint.title}
              </h3>
            </div>

            <p className="text-default-500 text-sm line-clamp-2 mb-2">
              {complaint.content}
            </p>

            <div className="flex flex-wrap gap-2 mb-2">
              <Chip color="default" variant="flat" size="sm">
                {getCategoryLabel(complaint.category)}
              </Chip>

              <Chip color={getStatusColor(complaint.status)} variant="flat" size="sm">
                {getStatusText(complaint.status)}
              </Chip>

              {complaint.tags && complaint.tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} variant="flat" size="sm">
                  {tag}
                </Chip>
              ))}

              {complaint.tags && complaint.tags.length > 3 && (
                <Chip variant="flat" size="sm">+{complaint.tags.length - 3}</Chip>
              )}
            </div>

            <div className="flex items-center text-xs text-default-500 gap-4">
              <div className="flex items-center gap-1">
                <FaCalendarAlt size={12} />
                <span>{formatRelativeTime(complaint.createdAt)}</span>
              </div>

              <span>โดย {complaint.is_anonymous ? "ไม่เปิดเผยตัวตน" : complaint.user_name}</span>

              {complaint.responses && complaint.responses.length > 0 && (
                <div className="flex items-center gap-1">
                  <FaComments size={12} />
                  <span>{complaint.responses.length} การตอบกลับ</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}