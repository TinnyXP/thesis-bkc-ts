// src/app/complaints/page.tsx
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
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Checkbox,
  Divider
} from "@heroui/react";
import { 
  FaClipboardList, 
  FaSearch, 
  FaPlus, 
  FaEye, 
  FaTrash, 
  FaCalendarAlt,
  FaImage,
  FaTags,
  FaUpload,
  FaExclamationTriangle,
  FaSyncAlt,
  FaMapMarkedAlt
} from "react-icons/fa";
import Link from "next/link";
import { NavBar, Footer, Loading } from "@/components";
import { useComplaints, Complaint } from "@/hooks/useComplaints";
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

export default function ComplaintsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // State สำหรับฟอร์มสร้างเรื่องร้องเรียนใหม่
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [category, setCategory] = useState<string>("other");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [tags, setTags] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // โหลดข้อมูลเรื่องร้องเรียน
  const {
    complaints,
    pagination,
    isLoading,
    isSubmitting,
    submitComplaint,
    deleteComplaint,
    changeStatus,
    changeCategory,
    changePage,
    refreshComplaints
  } = useComplaints(selectedStatus, selectedCategory);
  
  // Modal สร้างเรื่องร้องเรียนใหม่
  const {
    isOpen: isCreateModalOpen,
    onOpen: onCreateModalOpen,
    onClose: onCreateModalClose,
    onOpenChange: onCreateModalOpenChange
  } = useDisclosure();
  
  // Modal ยืนยันการลบเรื่องร้องเรียน
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpenChange: onDeleteModalOpenChange
  } = useDisclosure();
  
  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // กรองข้อมูลเรื่องร้องเรียนตามการค้นหา
  const filteredComplaints = searchTerm
    ? complaints.filter(complaint =>
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  
  // ลบเรื่องร้องเรียน
  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;
    
    try {
      const result = await deleteComplaint(selectedComplaint._id);
      if (result.success) {
        showToast("ลบเรื่องร้องเรียนเรียบร้อยแล้ว", "success");
        onDeleteModalClose();
        setSelectedComplaint(null);
      }
    } catch (error) {
      console.error("Error deleting complaint:", error);
    }
  };
  
  // จัดการการอัพโหลดรูปภาพ
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: File[] = [];
    const newPreviews: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newImages.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }
    
    setImages([...images, ...newImages]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };
  
  // ลบรูปภาพที่เลือก
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    
    // เพิ่ม URL.revokeObjectURL เพื่อป้องกัน memory leak
    URL.revokeObjectURL(newPreviews[index]);
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };
  
  // ส่งฟอร์มสร้างเรื่องร้องเรียนใหม่
  const handleSubmitComplaint = async () => {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title.trim()) {
      showToast("กรุณากรอกหัวข้อเรื่องร้องเรียน", "error");
      return;
    }
    
    if (!content.trim()) {
      showToast("กรุณากรอกรายละเอียดเรื่องร้องเรียน", "error");
      return;
    }
    
    if (!category) {
      showToast("กรุณาเลือกหมวดหมู่", "error");
      return;
    }
    
    try {
      const tagsArray = tags.trim() ? tags.split(',').map(tag => tag.trim()) : [];
      
      const result = await submitComplaint({
        title,
        content,
        location,
        category,
        is_anonymous: isAnonymous,
        tags: tagsArray,
        images
      });
      
      if (result.success) {
        // รีเซ็ตฟอร์ม
        setTitle("");
        setContent("");
        setLocation("");
        setCategory("other");
        setIsAnonymous(false);
        setTags("");
        
        // ยกเลิก URL.createObjectURL เพื่อป้องกัน memory leak
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImages([]);
        setImagePreviews([]);
        
        // ปิด Modal
        onCreateModalClose();
        
        // รีเฟรชข้อมูลเรื่องร้องเรียน
        refreshComplaints();
        
        showToast("ส่งเรื่องร้องเรียนเรียบร้อยแล้ว", "success");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
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
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return "รอดำเนินการ";
      case 'inprogress': return "กำลังดำเนินการ";
      case 'resolved': return "แก้ไขแล้ว";
      case 'rejected': return "ไม่อนุมัติ";
      default: return status;
    }
  };
  
  // แปลงหมวดหมู่เป็นข้อความ
  const getCategoryText = (categoryValue: string): string => {
    const category = complaintCategories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };
  
  if (status === "loading") {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FaClipboardList className="text-primary" />
                เรื่องร้องเรียน
              </h1>
              <p className="text-default-500">รายการเรื่องร้องเรียนของคุณและสถานะการดำเนินการ</p>
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
                color="primary" 
                onPress={onCreateModalOpen}
                startContent={<FaPlus />}
              >
                สร้างเรื่องร้องเรียนใหม่
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
                            <Chip
                              size="sm"
                              color={getStatusColor(complaint.status)}
                              variant="flat"
                            >
                              {getStatusText(complaint.status)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-default-500">
                              <FaCalendarAlt size={14} />
                              <span>{formatRelativeTime(complaint.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                as={Link}
                                href={`/complaints/${complaint._id}`}
                                isIconOnly
                                size="sm"
                                color="primary"
                                variant="light"
                              >
                                <FaEye />
                              </Button>
                              
                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() => {
                                  setSelectedComplaint(complaint);
                                  onDeleteModalOpen();
                                }}
                              >
                                <FaTrash />
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
        
        {/* Modal สร้างเรื่องร้องเรียนใหม่ */}
        <Modal 
          isOpen={isCreateModalOpen} 
          onOpenChange={onCreateModalOpenChange}
          backdrop="blur"
          size="lg"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <FaPlus className="text-primary" />
                    <span>สร้างเรื่องร้องเรียนใหม่</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col gap-4">
                    <Input
                      label="หัวข้อเรื่องร้องเรียน"
                      placeholder="ระบุหัวข้อเรื่องร้องเรียนของคุณ"
                      value={title}
                      onValueChange={setTitle}
                      variant="bordered"
                      isRequired
                    />
                    
                    <Textarea
                      label="รายละเอียด"
                      placeholder="อธิบายรายละเอียดเรื่องร้องเรียนของคุณ"
                      value={content}
                      onValueChange={setContent}
                      variant="bordered"
                      minRows={4}
                      maxRows={8}
                      isRequired
                    />
                    
                    <Input
                      label="สถานที่"
                      placeholder="ระบุสถานที่ที่เกี่ยวข้อง (ถ้ามี)"
                      value={location}
                      onValueChange={setLocation}
                      variant="bordered"
                      startContent={<FaMapMarkedAlt />}
                    />
                    
                    <Select
                      label="หมวดหมู่"
                      placeholder="เลือกหมวดหมู่"
                      selectedKeys={[category]}
                      onChange={(e) => setCategory(e.target.value)}
                      variant="bordered"
                      isRequired
                    >
                      {complaintCategories.filter(cat => cat.value !== "").map((category) => (
                        <SelectItem key={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </Select>
                    
                    <Input
                      label="แท็ก"
                      placeholder="ใส่แท็กคั่นด้วยเครื่องหมายจุลภาค (,)"
                      value={tags}
                      onValueChange={setTags}
                      variant="bordered"
                      startContent={<FaTags />}
                    />
                    
                    <div>
                      <p className="text-sm font-medium mb-2">รูปภาพประกอบ (ถ้ามี)</p>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`ภาพที่ ${index + 1}`}
                              className="w-24 h-24 object-cover rounded-md"
                            />
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="solid"
                              className="absolute top-1 right-1"
                              onPress={() => handleRemoveImage(index)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        color="default"
                        variant="bordered"
                        startContent={<FaUpload />}
                        onPress={() => document.getElementById('image-upload')?.click()}
                      >
                        อัปโหลดรูปภาพ
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    
                    <Checkbox
                      isSelected={isAnonymous}
                      onValueChange={setIsAnonymous}
                    >
                      ไม่เปิดเผยตัวตน
                    </Checkbox>
                    
                    {isAnonymous && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md text-amber-800 dark:text-amber-200 text-sm">
                        <p>โปรดทราบว่าการไม่เปิดเผยตัวตนจะซ่อนชื่อของคุณจากผู้ใช้ทั่วไป แต่ผู้ดูแลระบบยังสามารถเห็นข้อมูลของคุณได้</p>
                      </div>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSubmitComplaint}
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? "กำลังส่ง..." : "ส่งเรื่องร้องเรียน"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        
        {/* Modal ยืนยันการลบเรื่องร้องเรียน */}
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
                    <span>ยืนยันการลบเรื่องร้องเรียน</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  {selectedComplaint && (
                    <>
                      <p>คุณกำลังจะลบเรื่องร้องเรียน:</p>
                      <p className="font-semibold">{selectedComplaint.title}</p>
                      <Divider className="my-2" />
                      <p className="text-danger">การลบเรื่องร้องเรียนจะไม่สามารถกู้คืนได้ และการตอบกลับทั้งหมดจะถูกลบด้วย</p>
                    </>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    ยกเลิก
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleDeleteComplaint}
                  >
                    ลบเรื่องร้องเรียน
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
      
      <Footer />
    </div>
  );
}