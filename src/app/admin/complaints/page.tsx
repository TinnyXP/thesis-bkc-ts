// src/app/admin/complaints/page.tsx
"use client";

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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Card,
  CardBody,
  Chip,
  Select,
  SelectItem,
  Pagination,
  Tooltip,
  useDisclosure,
  Spinner,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react";
import { 
  FaClipboardList, 
  FaSearch, 
  FaEye, 
  FaReply, 
  FaCalendarAlt,
  FaUserAlt,
  FaExclamationTriangle,
  FaSyncAlt,
  FaCheck,
  FaHourglass,
  FaTimes,
  FaComments,
  FaFilter
} from "react-icons/fa";
import Link from "next/link";
import { AdminSidebar, Loading } from "@/components";
import { useComplaints, Complaint } from "@/hooks/useComplaints";
import { useAdmin } from "@/hooks/useAdmin";
import { showToast } from "@/lib/toast";
import { formatRelativeTime, formatDateTime } from "@/lib/dateUtils";

// กำหนดประเภทเรื่องร้องเรียน
const complaintCategories: { label: string; value: string }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "บริการ", value: "service" },
  { label: "สถานที่", value: "place" },
  { label: "ความปลอดภัย", value: "safety" },
  { label: "สิ่งแวดล้อม", value: "environment" },
  { label: "อื่นๆ", value: "other" }
];

// กำหนดสถานะเรื่องร้องเรียน
const complaintStatuses: { label: string; value: string }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "รอดำเนินการ", value: "pending" },
  { label: "กำลังดำเนินการ", value: "inprogress" },
  { label: "แก้ไขแล้ว", value: "resolved" },
  { label: "ไม่อนุมัติ", value: "rejected" }
];

export default function AdminComplaintsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin, isSuperAdmin, isLoading: isLoadingAdmin } = useAdmin();
  
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [responseContent, setResponseContent] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  
  // โหลดข้อมูลเรื่องร้องเรียน
  const {
    complaints,
    pagination,
    isLoading,
    changeStatus,
    changeCategory,
    changePage,
    refreshComplaints
  } = useComplaints(selectedStatus, selectedCategory);
  
  // Modal แสดงรายละเอียดและตอบกลับ
  const {
    isOpen: isResponseModalOpen,
    onOpen: onResponseModalOpen,
    onClose: onResponseModalClose,
    onOpenChange: onResponseModalOpenChange
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
  
  // กรองข้อมูลเรื่องร้องเรียนตามการค้นหา
  const filteredComplaints = searchTerm
    ? complaints.filter(complaint =>
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (complaint.tags && complaint.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    : complaints;
  
  // เปลี่ยนหมวดหมู่ที่เลือก
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    changeCategory(value);
  };
  
  // เปลี่ยนสถานะที่เลือก
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    changeStatus(value);
  };
  
  // รีเฟรชข้อมูลเรื่องร้องเรียน
  const handleRefreshComplaints = async () => {
    setIsRefreshing(true);
    try {
      await refreshComplaints();
      showToast("รีเฟรชข้อมูลเรื่องร้องเรียนเรียบร้อยแล้ว", "success");
    } catch (error) {
      console.error("Error refreshing complaints:", error);
      showToast("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล", "error");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // เปิด Modal ตอบกลับเรื่องร้องเรียน
  const openResponseModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResponseContent("");
    setNewStatus(complaint.status || "pending");
    onResponseModalOpen();
  };
  
  // ส่งการตอบกลับและอัปเดตสถานะ
  const handleSubmitResponse = async () => {
    if (!selectedComplaint) return;
    
    // ตรวจสอบว่ามีการกรอกข้อความตอบกลับหรือไม่
    if (!responseContent.trim()) {
      showToast("กรุณากรอกข้อความตอบกลับ", "error");
      return;
    }
    
    setIsSubmittingResponse(true);
    
    try {
      // ส่งคำตอบกลับไปยัง API
      const response = await fetch(`/api/complaints/${selectedComplaint._id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: responseContent })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast("ส่งการตอบกลับเรียบร้อยแล้ว", "success");
        
        // อัปเดตสถานะถ้ามีการเปลี่ยนแปลง
        if (newStatus !== selectedComplaint.status) {
          await updateComplaintStatus();
        } else {
          // ปิด Modal และรีเฟรชข้อมูล
          onResponseModalClose();
          refreshComplaints();
        }
      } else {
        showToast(result.message || "ไม่สามารถส่งการตอบกลับได้", "error");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      showToast("เกิดข้อผิดพลาดในการส่งการตอบกลับ", "error");
    } finally {
      setIsSubmittingResponse(false);
    }
  };
  
  // อัปเดตสถานะเรื่องร้องเรียน
  const updateComplaintStatus = async () => {
    if (!selectedComplaint) return;
    
    setIsUpdatingStatus(true);
    
    try {
      // ส่งคำขออัปเดตสถานะไปยัง API
      const response = await fetch(`/api/complaints/${selectedComplaint._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(`อัปเดตสถานะเป็น "${getStatusText(newStatus)}" เรียบร้อยแล้ว`, "success");
        
        // ปิด Modal และรีเฟรชข้อมูล
        onResponseModalClose();
        refreshComplaints();
      } else {
        showToast(result.message || "ไม่สามารถอัปเดตสถานะได้", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("เกิดข้อผิดพลาดในการอัปเดตสถานะ", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  // แปลงสถานะเป็นสีและข้อความ
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return "warning";
      case 'inprogress': return "primary";
      case 'resolved': return "success";
      case 'rejected': return "danger";
      default: return "default";
    }
  };
  
  // src/app/admin/complaints/page.tsx (ต่อ)
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return "รอดำเนินการ";
      case 'inprogress': return "กำลังดำเนินการ";
      case 'resolved': return "แก้ไขแล้ว";
      case 'rejected': return "ไม่อนุมัติ";
      default: return status;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaHourglass className="text-warning" />;
      case 'inprogress': return <FaComments className="text-primary" />;
      case 'resolved': return <FaCheck className="text-success" />;
      case 'rejected': return <FaTimes className="text-danger" />;
      default: return null;
    }
  };
  
  // แปลงหมวดหมู่เป็นข้อความ
  const getCategoryText = (categoryValue: string): string => {
    const category = complaintCategories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
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
                <FaClipboardList className="text-primary" />
                จัดการเรื่องร้องเรียน
              </h1>
              <p className="text-default-500">จัดการเรื่องร้องเรียนจากผู้ใช้งานและตอบกลับ</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                color="default" 
                onPress={handleRefreshComplaints}
                isLoading={isRefreshing}
                startContent={!isRefreshing && <FaSyncAlt />}
              >
                {isRefreshing ? "กำลังโหลด..." : "รีเฟรช"}
              </Button>
              
              <Button 
                as={Link}
                href="/complaints"
                color="primary" 
                startContent={<FaEye />}
              >
                ดูหน้าเรื่องร้องเรียน
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
                    className="w-full sm:w-40"
                    startContent={<FaFilter size={14} />}
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
                    selectedKeys={[selectedStatus]}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    size="sm"
                    className="w-full sm:w-40"
                    startContent={<FaFilter size={14} />}
                  >
                    {complaintStatuses.map((status) => (
                      <SelectItem key={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    placeholder="ค้นหาเรื่องร้องเรียน..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    startContent={<FaSearch />}
                    size="sm"
                    className="w-full sm:w-60"
                  />
                </div>
                
                <div className="text-sm text-default-500">
                  พบ {filteredComplaints.length} รายการ จากทั้งหมด {complaints.length} รายการ
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner label="กำลังโหลดข้อมูล..." color="primary" />
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-10">
                  <FaClipboardList size={40} className="mx-auto mb-4 text-default-400" />
                  <p className="text-default-500">ไม่พบเรื่องร้องเรียนที่คุณค้นหา</p>
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
                  <Table aria-label="รายการเรื่องร้องเรียน">
                    <TableHeader>
                      <TableColumn>เรื่อง</TableColumn>
                      <TableColumn>หมวดหมู่</TableColumn>
                      <TableColumn>ผู้ร้องเรียน</TableColumn>
                      <TableColumn>สถานะ</TableColumn>
                      <TableColumn>วันที่</TableColumn>
                      <TableColumn>การจัดการ</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredComplaints.map((complaint) => (
                        <TableRow key={complaint._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium line-clamp-1">{complaint.title}</p>
                              <p className="text-tiny text-default-500 line-clamp-1">{complaint.content}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip size="sm" variant="flat">
                              {getCategoryText(complaint.category)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FaUserAlt size={14} className="text-default-400" />
                              <span>
                                {complaint.is_anonymous ? "ไม่เปิดเผยตัวตน" : complaint.user_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={getStatusColor(complaint.status)}
                              variant="flat"
                              startContent={getStatusIcon(complaint.status)}
                            >
                              {getStatusText(complaint.status)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Tooltip content={formatDateTime(complaint.createdAt)}>
                              <div className="flex items-center gap-1 text-default-500">
                                <FaCalendarAlt size={14} />
                                <span>{formatRelativeTime(complaint.createdAt)}</span>
                              </div>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                startContent={<FaReply />}
                                onPress={() => openResponseModal(complaint)}
                              >
                                ตอบกลับ
                              </Button>
                              
                              <Button
                                as={Link}
                                href={`/complaints/${complaint._id}`}
                                isIconOnly
                                size="sm"
                                color="default"
                                variant="light"
                              >
                                <FaEye />
                              </Button>
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
        
        {/* Modal ตอบกลับและอัปเดตสถานะ */}
        <Modal 
          isOpen={isResponseModalOpen} 
          onOpenChange={onResponseModalOpenChange}
          backdrop="blur"
          size="xl"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <FaReply className="text-primary" />
                    <span>ตอบกลับเรื่องร้องเรียน</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  {selectedComplaint && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="font-semibold mb-1">{selectedComplaint.title}</h3>
                        <p className="text-sm text-default-500 line-clamp-3">{selectedComplaint.content}</p>
                      </div>
                      
                      <Divider />
                      
                      <div className="flex flex-wrap gap-4">
                        <div className="w-full md:w-1/2">
                          <p className="text-sm font-semibold mb-2">ข้อมูลเรื่องร้องเรียน</p>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-default-500">หมวดหมู่: </span>
                              <span>{getCategoryText(selectedComplaint.category)}</span>
                            </div>
                            <div>
                              <span className="text-default-500">ผู้ร้องเรียน: </span>
                              <span>
                                {selectedComplaint.is_anonymous ? "ไม่เปิดเผยตัวตน" : selectedComplaint.user_name}
                              </span>
                            </div>
                            <div>
                              <span className="text-default-500">วันที่: </span>
                              <span>{formatDateTime(selectedComplaint.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-1/2">
                          <p className="text-sm font-semibold mb-2">อัปเดตสถานะ</p>
                          <Select
                            label="เลือกสถานะใหม่"
                            selectedKeys={[newStatus]}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full"
                          >
                            <SelectItem key="pending" startContent={getStatusIcon("pending")}>
                              รอดำเนินการ
                            </SelectItem>
                            <SelectItem key="inprogress" startContent={getStatusIcon("inprogress")}>
                              กำลังดำเนินการ
                            </SelectItem>
                            <SelectItem key="resolved" startContent={getStatusIcon("resolved")}>
                              แก้ไขแล้ว
                            </SelectItem>
                            <SelectItem key="rejected" startContent={getStatusIcon("rejected")}>
                              ไม่อนุมัติ
                            </SelectItem>
                          </Select>
                          
                          <div className="mt-2">
                            <Button
                              color={getStatusColor(newStatus)}
                              variant="flat"
                              size="sm"
                              className="w-full"
                              startContent={getStatusIcon(newStatus)}
                              onPress={updateComplaintStatus}
                              isLoading={isUpdatingStatus}
                              isDisabled={isSubmittingResponse}
                            >
                              อัปเดตสถานะเป็น {getStatusText(newStatus)}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <Divider />
                      
                      <div>
                        <p className="text-sm font-semibold mb-2">
                          ข้อความตอบกลับ <span className="text-danger">*</span>
                        </p>
                        <Textarea
                          placeholder="พิมพ์ข้อความตอบกลับเรื่องร้องเรียนที่นี่..."
                          value={responseContent}
                          onValueChange={setResponseContent}
                          minRows={4}
                        />
                      </div>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSubmitResponse}
                    isLoading={isSubmittingResponse}
                    isDisabled={isUpdatingStatus}
                  >
                    {isSubmittingResponse ? "กำลังส่ง..." : "ส่งการตอบกลับ"}
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