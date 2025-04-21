"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Pagination,
  Select,
  SelectItem,
  Skeleton,
  useDisclosure,
  Divider,
} from "@heroui/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FaSort, FaSignInAlt, FaInfoCircle } from "react-icons/fa";

import { useReviews } from "@/hooks/useReviews";
import SummaryRatingCard from "./SummaryRatingCard";
import ReviewItem from "./ReviewItem";
import ReviewModal from "./ReviewModal";

interface ReviewSectionProps {
  placeId: string;
}

export default function ReviewSection({ placeId }: ReviewSectionProps) {
  const { data: session } = useSession();
  const {
    reviews,
    stats,
    pagination,
    isLoading,
    changePage,
    changeSort,
    currentSort,
    addReview,
    deleteReview,
    isReviewOwner,
    hasReviewed,
    refreshReviews,
  } = useReviews(placeId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  // จัดการเมื่อกดปุ่มรีวิว
  const handleReviewButtonClick = () => {
    if (!session) {
      // กรณียังไม่ได้ล็อกอิน กระตุ้นให้ล็อกอินก่อน
      return;
    }
    onOpen();
  };

  // จัดการการส่งรีวิวใหม่
  const handleSubmitReview = async (data: {
    rating: number;
    title: string;
    content: string;
  }) => {
    setIsSubmitting(true);
    try {
      const result = await addReview(data);
      if (result.success) {
        onClose();
        refreshReviews();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // จัดการการลบรีวิว
  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <div className="font-[family-name:var(--font-line-seed-sans)]">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaInfoCircle className="text-primary-color" />
        รีวิวจากผู้เข้าชม
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* แสดงสรุปคะแนนรีวิว */}
        <div className="md:col-span-1">
          {isLoading ? (
            <Card className="shadow-sm">
              <CardBody>
                <Skeleton className="rounded-lg h-28 w-full mb-4" />
                <Skeleton className="rounded-lg h-24 w-full" />
              </CardBody>
            </Card>
          ) : (
            <SummaryRatingCard
              ratings={stats.ratingsFormatted}
              totalReviews={stats.totalReviews}
              averageRating={stats.averageRating}
              onWriteReview={handleReviewButtonClick}
              hasReviewed={hasReviewed()}
            />
          )}

          {/* โปรโมชั่นสำหรับผู้ที่ยังไม่ได้ล็อกอิน */}
          {!session && (
            <Card className="bg-primary-50 dark:bg-primary-900/20 shadow-sm mt-4">
              <CardBody>
                <h3 className="text-lg font-semibold text-primary-color mb-2">
                  เข้าสู่ระบบเพื่อรีวิว
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
                  แชร์ประสบการณ์ของคุณและช่วยเหลือผู้อื่นในการตัดสินใจ
                </p>
                <Button
                  as={Link}
                  href="/login"
                  color="primary"
                  variant="flat"
                  fullWidth
                  startContent={<FaSignInAlt />}
                >
                  เข้าสู่ระบบ
                </Button>
              </CardBody>
            </Card>
          )}
        </div>

        {/* รายการรีวิว */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {stats.totalReviews > 0
                ? `${stats.totalReviews} รีวิว`
                : "ยังไม่มีรีวิว"}
            </h3>

            {/* ตัวเลือกการเรียงลำดับ */}
            {stats.totalReviews > 0 && (
              <Select
                startContent={<FaSort />}
                placeholder="เรียงตาม"
                size="sm"
                selectedKeys={[currentSort]}
                onChange={(e) => {
                  changeSort(e.target.value as "newest" | "highest" | "lowest");
                }}
                variant="bordered"
                className="w-40"
              >
                <SelectItem key="newest">ล่าสุด</SelectItem>
                <SelectItem key="highest">คะแนนสูงสุด</SelectItem>
                <SelectItem key="lowest">คะแนนต่ำสุด</SelectItem>
              </Select>
            )}
          </div>

          {/* รายการรีวิว */}
          <Card className="shadow-sm">
            <CardBody>
              {isLoading ? (
                // แสดง Skeleton ระหว่างโหลดข้อมูล
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="mb-6">
                    <div className="flex items-start gap-3 mb-3">
                      <Skeleton className="rounded-full h-10 w-10" />
                      <div className="flex-1">
                        <Skeleton className="rounded-lg h-5 w-32 mb-2" />
                        <Skeleton className="rounded-lg h-4 w-20 mb-3" />
                        <Skeleton className="rounded-lg h-4 w-full mb-2" />
                        <Skeleton className="rounded-lg h-4 w-3/4" />
                      </div>
                    </div>
                    {index < 2 && <Divider />}
                  </div>
                ))
              ) : reviews.length > 0 ? (
                // แสดงรายการรีวิว
                <>
                  {reviews.map((review) => (
                    <ReviewItem
                      key={review._id}
                      review={review}
                      isOwner={isReviewOwner(review)}
                      onDelete={handleDeleteReview}
                    />
                  ))}

                  {/* แสดงปุ่มเปลี่ยนหน้า */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-4">
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
                </>
              ) : (
                // แสดงข้อความเมื่อไม่มีรีวิว
                <div className="text-center py-6">
                  <p className="text-zinc-500 mb-2">ยังไม่มีรีวิวสำหรับสถานที่นี้</p>
                  {session && !hasReviewed() && (
                    <Button
                      color="primary"
                      variant="flat"
                      size="sm"
                      onPress={handleReviewButtonClick}
                    >
                      เป็นคนแรกที่รีวิว
                    </Button>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal สำหรับเพิ่มรีวิว */}
      <ReviewModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}