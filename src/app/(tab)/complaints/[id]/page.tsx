"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useParams } from 'next/navigation';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Chip,
  Button,
  Textarea,
  Tooltip,
  Avatar,
  AvatarIcon,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import { FaCalendarAlt, FaUser, FaTag, FaMapMarkerAlt, FaReply, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import Image from "next/image";
import { formatDateTime } from "@/lib/dateUtils";
import { Loading } from "@/components";
import { useComplaintDetail } from "@/hooks/useComplaintDetail";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";

export default function ComplaintDetailPage() {
  const { id: complaintId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [responseContent, setResponseContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // useComplaintDetail hook แก้ไขให้รองรับข้อจำกัดของ TypeScript
  const {
    complaint,
    isLoading,
    isSubmittingResponse,
    addResponse,
    getStatusText,
    getStatusColor,
    refreshComplaint
  } = useComplaintDetail(complaintId as string);

  // สำหรับ Modal ยืนยันการลบ
  const { 
    isOpen: isDeleteModalOpen, 
    onOpen: onDeleteModalOpen, 
    onClose: onDeleteModalClose,
    onOpenChange: onDeleteModalOpenChange
  } = useDisclosure();

  // เช็คว่าผู้ใช้เป็น admin หรือไม่
  const isAdmin = React.useMemo(() => {
    if (!session || !session.user) return false;
    // ตรวจสอบจาก roles หรือ permissions ที่มีอยู่ใน session
    // สมมติว่าเราเก็บข้อมูลนี้ไว้ใน provider field
    return session.user.provider === 'admin' || session.user.provider === 'superadmin';
  }, [session]);

  // ส่งการตอบกลับ
  const handleSubmitResponse = async () => {
    if (!responseContent.trim()) {
      showToast("กรุณากรอกข้อความตอบกลับ", "error");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await addResponse(responseContent);
      
      if (result.success) {
        setResponseContent("");
        showToast("ส่งการตอบกลับเรียบร้อยแล้ว", "success");
      } else {
        showToast(result.message || "ไม่สามารถส่งการตอบกลับได้", "error");
      }
    } catch (error) {
      console.error("Error sending response:", error);
      showToast("เกิดข้อผิดพลาดในการส่งการตอบกลับ", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ลบเรื่องร้องเรียน
  const handleDeleteComplaint = async () => {
    setIsSubmitting(true);
    
    try {
      // เนื่องจาก useComplaintDetail ไม่มี deleteComplaint 
      // เราจะใช้ fetch โดยตรงแทน
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast("ลบเรื่องร้องเรียนเรียบร้อยแล้ว", "success");
        router.push('/complaints');
      } else {
        showToast(result.message || "ไม่สามารถลบเรื่องร้องเรียนได้", "error");
      }
    } catch (error) {
      console.error("Error deleting complaint:", error);
      showToast("เกิดข้อผิดพลาดในการลบเรื่องร้องเรียน", "error");
    } finally {
      setIsSubmitting(false);
      onDeleteModalClose();
    }
  };

  if (isLoading || status === "loading") {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen={false} />;
  }

  if (!complaint) {
    return (
      <div className="p-4">
        <Card>
          <CardBody className="text-center py-10">
            <FaExclamationTriangle size={40} className="mx-auto mb-4 text-warning" />
            <h2 className="text-2xl font-bold mb-2">ไม่พบเรื่องร้องเรียน</h2>
            <p className="text-default-500 mb-4">เรื่องร้องเรียนนี้อาจถูกลบไปแล้วหรือไม่มีอยู่ในระบบ</p>
            <Button color="primary" onPress={() => router.push('/complaints')}>
              กลับไปยังรายการเรื่องร้องเรียน
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // แปลง string เป็น type ที่ยอมรับได้ใน Chip component
  const getChipColor = (status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" | undefined => {
    switch (status) {
      case 'pending': return "warning";
      case 'inprogress': return "primary";
      case 'resolved': return "success";
      case 'rejected': return "danger";
      default: return "default";
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{complaint.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              color={getChipColor(complaint.status)}
              size="lg"
              variant="bordered"
            >
              {getStatusText(complaint.status)}
            </Chip>
            <Chip color="default" variant="flat" size="sm">
              <div className="flex items-center gap-1">
                <FaCalendarAlt size={14} />
                <span>{formatDateTime(complaint.createdAt)}</span>
              </div>
            </Chip>
            <Chip color="default" variant="flat" size="sm">
              <div className="flex items-center gap-1">
                <FaTag size={14} />
                <span>{complaint.category}</span>
              </div>
            </Chip>
            {complaint.location && (
              <Chip color="default" variant="flat" size="sm">
                <div className="flex items-center gap-1">
                  <FaMapMarkerAlt size={14} />
                  <span>{complaint.location}</span>
                </div>
              </Chip>
            )}
          </div>
        </CardHeader>

        <Divider />

        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <Avatar
              size="sm"
              icon={<AvatarIcon />}
              src={complaint.user_image || undefined}
              showFallback
            />
            <div>
              <p className="font-medium">{complaint.is_anonymous ? "ไม่เปิดเผยตัวตน" : complaint.user_name}</p>
            </div>
          </div>

          <p className="mb-6 whitespace-pre-line">{complaint.content}</p>

          {complaint.images && complaint.images.length > 0 && (
            <div className="mt-4">
              <p className="font-medium mb-2">รูปภาพประกอบ</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {complaint.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-video overflow-hidden rounded-md border border-default-200"
                  >
                    <Image
                      src={image}
                      alt={`รูปประกอบเรื่องร้องเรียน ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isAdmin && (
            <div className="mt-6 flex justify-end">
              <Button 
                color="danger" 
                variant="light"
                onPress={onDeleteModalOpen}
                startContent={<FaTrash />}
              >
                ลบเรื่องร้องเรียน
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* แสดงการตอบกลับ */}
      {complaint.responses && complaint.responses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">การตอบกลับ</h2>
          </CardHeader>
          <Divider />
          <CardBody className="divide-y divide-default-200">
            {complaint.responses.map((response, index) => (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-primary-color rounded-full w-8 h-8 flex items-center justify-center text-white">
                    <FaUser />
                  </div>
                  <div>
                    <p className="font-medium">{response.admin_name}</p>
                    <p className="text-tiny text-default-500">
                      <Tooltip content={formatDateTime(response.created_at)}>
                        <span>{formatDateTime(response.created_at)}</span>
                      </Tooltip>
                    </p>
                  </div>
                </div>
                <p className="ml-10 whitespace-pre-line">{response.content}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* ส่วนตอบกลับ (สำหรับแอดมินเท่านั้น) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">ตอบกลับเรื่องร้องเรียน</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Textarea
              label="ข้อความตอบกลับ"
              placeholder="พิมพ์ข้อความตอบกลับเรื่องร้องเรียนที่นี่..."
              value={responseContent}
              onValueChange={setResponseContent}
              minRows={4}
              isDisabled={isSubmitting || isSubmittingResponse}
            />
            <div className="flex justify-end mt-4">
              <Button
                color="primary"
                startContent={<FaReply />}
                onPress={handleSubmitResponse}
                isLoading={isSubmitting || isSubmittingResponse}
              >
                ส่งการตอบกลับ
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

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
                <p>คุณกำลังจะลบเรื่องร้องเรียนนี้:</p>
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
                  isLoading={isSubmitting}
                >
                  ลบเรื่องร้องเรียน
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}