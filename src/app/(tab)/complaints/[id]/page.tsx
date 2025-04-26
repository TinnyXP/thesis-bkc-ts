// src/app/complaints/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Link,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Spinner,
  useDisclosure
} from "@heroui/react";
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaTag, 
  FaUser, 
  FaTrash,
  FaExclamationTriangle,
  FaImage,
  FaReply,
  FaCheckCircle
} from "react-icons/fa";
import { NavBar, Footer, Loading } from "@/components";
import { useComplaintDetail } from "@/hooks/useComplaintDetail";
import { showToast } from "@/lib/toast";
import { formatDateTime } from "@/lib/dateUtils";

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const complaintId = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const {
    complaint,
    isLoading,
    isSubmittingResponse,
    addResponse,
    getStatusText,
    getStatusColor,
    deleteComplaint,
    refreshComplaint
  } = useComplaintDetail(complaintId);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [responseContent, setResponseContent] = useState<string>("");
  
  // Modal ยืนยันการลบเรื่องร้องเรียน
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpenChange: onDeleteModalOpenChange
  } = useDisclosure();
  
  // Modal ดูรูปภาพขนาดใหญ่
  const {
    isOpen: isImageModalOpen,
    onOpen: onImageModalOpen,
    onClose: onImageModalClose,
    onOpenChange: onImageModalOpenChange
  } = useDisclosure();
  
  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // ตรวจสอบสิทธิ์การเข้าถึง
  useEffect(() => {
    if (complaint && session) {
      // ตรวจสอบว่าเป็นเจ้าของเรื่องร้องเรียนหรือไม่
      const isOwner = complaint.user_bkc_id === session.user.bkcId;
      
      // ถ้าไม่ใช่เจ้าของและไม่ใช่ admin ให้กลับไปหน้ารายการเรื่องร้องเรียน
      if (!isOwner) {
        showToast("คุณไม่มีสิทธิ์เข้าถึงเรื่องร้องเรียนนี้", "error");
        router.push("/complaints");
      }
    }
  }, [complaint, session, router]);
  
  // ส่งการตอบกลับใหม่
  const handleSubmitResponse = async () => {
    if (!responseContent.trim()) {
      showToast("กรุณากรอกข้อความตอบกลับ", "error");
      return;
    }
    
    try {
      const result = await addResponse(responseContent);
      
      if (result.success) {
        setResponseContent("");
        refreshComplaint();
        showToast("ส่งการตอบกลับเรียบร้อยแล้ว", "success");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
    }
  };
  
  // ลบเรื่องร้องเรียน
  const handleDeleteComplaint = async () => {
    try {
      const result = await deleteComplaint();
      
      if (result.success) {
        showToast("ลบเรื่องร้องเรียนเรียบร้อยแล้ว", "success");
        router.push("/complaints");
      }
    } catch (error) {
      console.error("Error deleting complaint:", error);
    }
  };
  
  // เปิดรูปภาพขนาดใหญ่
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    onImageModalOpen();
  };
  
  if (status === "loading" || isLoading) {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen />;
  }
  
  if (!complaint) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-[family-name:var(--font-line-seed-sans)]">
        <NavBar />
        
        <div className="container mx-auto px-4 py-8 flex-1">
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-10">
              <FaExclamationTriangle size={40} className="text-danger mb-4" />
              <h2 className="text-xl font-bold mb-2">ไม่พบเรื่องร้องเรียน</h2>
              <p className="text-default-500 mb-6">เรื่องร้องเรียนที่คุณกำลังค้นหาอาจถูกลบไปแล้วหรือไม่มีอยู่จริง</p>
              <Button 
                as={Link} 
                href="/complaints" 
                color="primary"
                startContent={<FaArrowLeft />}
              >
                กลับไปยังรายการเรื่องร้องเรียน
              </Button>
            </CardBody>
          </Card>
        </div>
        
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-[family-name:var(--font-line-seed-sans)]">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-4">
          <Button 
            as={Link} 
            href="/complaints" 
            color="default" 
            variant="light"
            startContent={<FaArrowLeft />}
          >
            กลับไปยังรายการเรื่องร้องเรียน
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* เนื้อหาเรื่องร้องเรียน */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold">{complaint.title}</h1>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Chip
                        size="sm"
                        color={getStatusColor(complaint.status)}
                        variant="flat"
                      >
                        {getStatusText(complaint.status)}
                      </Chip>
                      
                      <Chip
                        size="sm"
                        variant="flat"
                        startContent={<FaTag size={14} />}
                      >
                        {complaint.category}
                      </Chip>
                      
                      {complaint.location && (
                        <Chip
                          size="sm"
                          variant="flat"
                          startContent={<FaMapMarkerAlt size={14} />}
                        >
                          {complaint.location}
                        </Chip>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    color="danger"
                    variant="light"
                    isIconOnly
                    onPress={onDeleteModalOpen}
                  >
                    <FaTrash />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 text-default-500 text-sm mt-2">
                  <FaCalendarAlt size={14} />
                  <span>{formatDateTime(complaint.createdAt)}</span>
                </div>
              </CardHeader>
              
              <Divider />
              
              <CardBody>
                <p className="whitespace-pre-line mb-6">{complaint.content}</p>
                
                {complaint.images && complaint.images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">รูปภาพประกอบ</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {complaint.images.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative cursor-pointer overflow-hidden rounded-md"
                          onClick={() => openImageModal(image)}
                        >
                          <div className="aspect-square">
                            <Image
                              src={image}
                              alt={`รูปภาพประกอบ ${index + 1}`}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {complaint.tags && complaint.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2">แท็ก</h3>
                    <div className="flex flex-wrap gap-2">
                      {complaint.tags.map((tag, index) => (
                        <Chip key={index} size="sm" variant="flat">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* การตอบกลับจากผู้ดูแลระบบ */}
            <div>
              <h2 className="text-xl font-bold mb-4">การตอบกลับ</h2>
              
              {complaint.responses && complaint.responses.length > 0 ? (
                <div className="space-y-4">
                  {complaint.responses.map((response, index) => (
                    <Card key={index} className="border-default-200">
                      <CardHeader className="px-4 py-2 flex justify-between">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-primary-color" />
                          <span className="font-medium">{response.admin_name}</span>
                          <span className="text-xs text-default-500">
                            (ผู้ดูแลระบบ)
                          </span>
                        </div>
                        <span className="text-xs text-default-500">
                          {formatDateTime(response.created_at)}
                        </span>
                      </CardHeader>
                      <CardBody className="px-4 py-3">
                        <p className="whitespace-pre-line">{response.content}</p>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardBody className="py-10 text-center">
                    <p className="text-default-500">ยังไม่มีการตอบกลับจากผู้ดูแลระบบ</p>
                  </CardBody>
                </Card>
              )}
              
              {/* ฟอร์มตอบกลับสำหรับ admin */}
              {session?.user.isAdmin && (
                <Card className="mt-6">
                  <CardHeader>
                    <h3 className="text-lg font-semibold">ตอบกลับเรื่องร้องเรียน</h3>
                  </CardHeader>
                  <CardBody>
                    <Textarea
                      placeholder="พิมพ์ข้อความตอบกลับที่นี่..."
                      value={responseContent}
                      onValueChange={setResponseContent}
                      minRows={3}
                      className="mb-4"
                    />
                    <Button
                      color="primary"
                      startContent={<FaReply />}
                      onPress={handleSubmitResponse}
                      isLoading={isSubmittingResponse}
                    >
                      ส่งการตอบกลับ
                    </Button>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
          
          {/* ข้อมูลสรุปและสถานะ */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold">สถานะเรื่องร้องเรียน</h3>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-default-500 mb-1">สถานะปัจจุบัน</p>
                    <Chip
                      color={getStatusColor(complaint.status)}
                      size="lg"
                      variant="bordered"
                    >
                      {getStatusText(complaint.status)}
                    </Chip>
                  </div>
                  
                  <div>
                    <p className="text-sm text-default-500 mb-1">วันที่สร้าง</p>
                    <p>{formatDateTime(complaint.createdAt)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-default-500 mb-1">อัปเดตล่าสุด</p>
                    <p>{formatDateTime(complaint.updatedAt)}</p>
                  </div>
                  
                  {complaint.responses && complaint.responses.length > 0 && (
                    <div>
                      <p className="text-sm text-default-500 mb-1">จำนวนการตอบกลับ</p>
                      <p>{complaint.responses.length} การตอบกลับ</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
            
            {complaint.status === 'resolved' && (
              <Card className="bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700">
                <CardBody>
                  <div className="flex items-center gap-3 text-success-700 dark:text-success-400">
                    <FaCheckCircle size={20} />
                    <div>
                      <h3 className="font-semibold">เรื่องร้องเรียนได้รับการแก้ไขแล้ว</h3>
                      <p className="text-sm">ขอบคุณสำหรับการแจ้งเรื่องร้องเรียน</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
      
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
                <p>คุณกำลังจะลบเรื่องร้องเรียน:</p>
                <p className="font-semibold">{complaint.title}</p>
                <Divider className="my-2" />
                <p className="text-danger">การลบเรื่องร้องเรียนจะไม่สามารถกู้คืนได้ และการตอบกลับทั้งหมดจะถูกลบด้วย</p>
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
      
      {/* Modal ดูรูปภาพขนาดใหญ่ */}
      <Modal 
        isOpen={isImageModalOpen} 
        onOpenChange={onImageModalOpenChange}
        backdrop="blur"
        size="3xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <FaImage />
                  <span>รูปภาพประกอบ</span>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedImage && (
                  <div className="flex justify-center">
                    <Image
                      src={selectedImage}
                      alt="รูปภาพขยาย"
                      width={800}
                      height={600}
                      objectFit="contain"
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      <Footer />
    </div>
  );
}