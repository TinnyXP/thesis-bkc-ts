// src/components/ui/Community/ComplaintDetail.tsx
"use client";

import React, { useCallback, useState } from 'react';
import { useSession } from "next-auth/react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Chip,
  Button,
  Avatar,
  AvatarIcon,
  Tooltip
} from "@heroui/react";
import { FaCalendarAlt, FaUser, FaTag, FaMapMarkerAlt, FaReply } from "react-icons/fa";
import Image from "next/image";
import { formatDateTime } from "@/lib/dateUtils";
import { Loading } from "@/components";
import { useComplaintDetail } from "@/hooks/useComplaintDetail";
import Link from "next/link";

interface ComplaintDetailProps {
  complaintId: string;
}

export default function ComplaintDetail({ complaintId }: ComplaintDetailProps) {
  const { data: session, status } = useSession();

  // useComplaintDetail hook
  const {
    complaint,
    isLoading,
    getStatusText,
    // getStatusColor,
  } = useComplaintDetail(complaintId);

  // ฟังก์ชัน getStatusColor ใน src/hooks/useComplaintDetail.ts
  const getStatusColor = useCallback((status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (status) {
      case 'pending': return "warning";
      case 'inprogress': return "primary";
      case 'resolved': return "success";
      case 'rejected': return "danger";
      default: return "default";
    }
  }, []);

  if (isLoading || status === "loading") {
    return <Loading message="กำลังโหลดข้อมูล..." fullScreen={false} />;
  }

  if (!complaint) {
    return (
      <Card>
        <CardBody className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">ไม่พบเรื่องร้องเรียน</h2>
          <p className="text-default-500 mb-4">เรื่องร้องเรียนนี้อาจถูกลบไปแล้วหรือไม่มีอยู่ในระบบ</p>
          <Button color="primary" as={Link} href="/community?tab=complaints">
            กลับไปยังรายการเรื่องร้องเรียน
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{complaint.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              color={getStatusColor(complaint.status)}
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
        </CardBody>
      </Card>

      {/* แสดงการตอบกลับ */}
      {complaint.responses && complaint.responses.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">การตอบกลับ</h2>
          </CardHeader>
          <Divider />
          <CardBody className="divide-y divide-default-200">
            {complaint.responses.map((response, index) => (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                // src/components/ui/Community/ComplaintDetail.tsx (ต่อ)
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

      {/* ส่วนแสดงข้อความเมื่อยังไม่มีการตอบกลับ */}
      {complaint.responses && complaint.responses.length === 0 && (
        <Card>
          <CardBody className="text-center py-6">
            <p className="text-default-500 mb-4">เรื่องร้องเรียนนี้ยังไม่มีการตอบกลับจากผู้ดูแลระบบ</p>
            <p className="text-sm text-default-400">เจ้าหน้าที่จะตอบกลับโดยเร็วที่สุด</p>
          </CardBody>
        </Card>
      )}

      {/* แสดงข้อความเมื่อเรื่องร้องเรียนถูกแก้ไขแล้ว */}
      {complaint.status === 'resolved' && (
        <Card className="bg-success-50 dark:bg-success-900/20">
          <CardBody className="text-center py-6">
            <p className="text-success-600 dark:text-success-400 font-medium">
              เรื่องร้องเรียนนี้ได้รับการแก้ไขเรียบร้อยแล้ว
            </p>
          </CardBody>
        </Card>
      )}

      {/* แสดงข้อความเมื่อเรื่องร้องเรียนถูกปฏิเสธ */}
      {complaint.status === 'rejected' && (
        <Card className="bg-danger-50 dark:bg-danger-900/20">
          <CardBody className="text-center py-6">
            <p className="text-danger-600 dark:text-danger-400 font-medium">
              เรื่องร้องเรียนนี้ไม่ได้รับการอนุมัติ
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}