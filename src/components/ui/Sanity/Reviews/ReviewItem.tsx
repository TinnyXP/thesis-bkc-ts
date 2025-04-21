"use client";

import React from "react";
import { Avatar, Button } from "@heroui/react";
import { FaStar, FaUserCircle, FaTrash } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Review } from "@/hooks/useReviews";

interface ReviewItemProps {
  review: Review;
  isOwner: boolean;
  onDelete: (id: string) => void;
  isDeleting?: boolean; // เพิ่ม prop นี้
}

export default function ReviewItem({ review, isOwner, onDelete }: ReviewItemProps) {

  // แปลงเวลา
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: th,
  });

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 relative group overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar
            src={review.user_image || undefined}
            fallback={<FaUserCircle />}
            className="flex-shrink-0"
            size="md"
          />
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-medium">{review.user_name}</h3>
              <span className="text-xs text-zinc-500">{formattedDate}</span>
            </div>

            {/* แสดงคะแนนดาว */}
            <div className="flex items-center mt-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`${star <= review.rating
                      ? "text-yellow-500"
                      : "text-zinc-300 dark:text-zinc-600"
                    }`}
                  size={16}
                />
              ))}
            </div>

            <h4 className="font-medium text-lg mb-1">{review.title}</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{review.content}</p>
          </div>
        </div>

        {/* ปุ่มเมนูตัวเลือก (แสดงเฉพาะเจ้าของรีวิว) */}
        {isOwner && (
          <Button
            size="sm"
            isIconOnly
            color="danger"
            variant="light"
            startContent={<FaTrash size={14} />}
            onPress={() => {
              onDelete(review._id);
            }}
            className="md:opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out"
          >
          </Button>
        )}
      </div>
    </div>
  );
}