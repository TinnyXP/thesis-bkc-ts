"use client";

import React from "react";
import { Button, Card, CardBody, Progress } from "@heroui/react";
import { FaStar, FaPen } from "react-icons/fa";
import { useSession } from "next-auth/react";

export interface RatingStats {
  rating: number;
  count: number;
}

export interface SummaryRatingCardProps {
  ratings: RatingStats[];
  totalReviews: number;
  averageRating: number;
  onWriteReview?: () => void;
  hasReviewed?: boolean;
  className?: string;
}

export default function SummaryRatingCard({
  ratings,
  totalReviews,
  averageRating,
  onWriteReview,
  hasReviewed = false,
  className,
}: SummaryRatingCardProps) {

  const { data: session } = useSession();
  
  return (
    <Card className={`bg-white shadow-sm dark:bg-zinc-950 border-2 border-zinc-150 dark:border-zinc-900 ${className}`}>
      <CardBody>
        <div className="flex flex-col gap-4">
          {/* แสดงคะแนนเฉลี่ย */}
          <div className="flex items-center gap-2">
            <FaStar className="text-yellow-500" size={20} />
            <span className="text-xl font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-zinc-500 text-sm">
              • ({totalReviews > 0 ? `${totalReviews} รีวิว` : "ยังไม่มีรีวิว"})
            </span>
          </div>

          {/* แสดงแท่งความยาวของแต่ละคะแนน */}
          <div className="flex flex-col gap-2 mt-2">
            {ratings.map(({ rating, count }) => {
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-2">
                  <div className="w-10 text-right text-sm">{rating} ดาว</div>
                  <Progress
                    aria-label={`${rating} ดาว`}
                    value={percentage}
                    color="warning"
                    className="flex-1"
                    size="sm"
                  />
                  <div className="w-10 text-left text-sm text-zinc-500">{count}</div>
                </div>
              );
            })}
          </div>

          {/* ปุ่มเขียนรีวิว */}
          <div className="mt-2">
            <Button
              fullWidth
              color="primary"
              variant="solid"
              startContent={<FaPen />}
              onPress={onWriteReview}
              isDisabled={hasReviewed || !session}
            >
              {hasReviewed ? "คุณได้รีวิวแล้ว" : "เขียนรีวิว"}
            </Button>
            {hasReviewed && (
              <p className="text-center text-xs text-zinc-500 mt-2">
                คุณสามารถรีวิวได้เพียงครั้งเดียวต่อสถานที่
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}