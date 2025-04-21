"use client";

import React from "react";
import { Loading, PlaceCard } from "@/components";
import { usePlaces } from "@/hooks/usePlaces";

/**
 * คอมโพเนนต์แสดงรายการสถานที่ท่องเที่ยวล่าสุด
 * ใช้ hook usePlaces เพื่อดึงข้อมูลสถานที่ท่องเที่ยว
 */
export default function PlaceCardList() {
  const { places, isLoading, isError } = usePlaces();

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        <h2 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h2>
        <p>ไม่สามารถโหลดข้อมูลสถานที่ท่องเที่ยวได้ โปรดลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">ไม่พบสถานที่ท่องเที่ยว</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          ขออภัย ยังไม่มีสถานที่ท่องเที่ยวในขณะนี้ โปรดกลับมาใหม่ในภายหลัง
        </p>
      </div>
    );
  }

  return <PlaceCard places={places} />;
}