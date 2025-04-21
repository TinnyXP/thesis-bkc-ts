"use client";

import React from "react";
import { Loading, PlaceCard } from "@/components";
import { usePlacesByDistrict } from "@/hooks/usePlacesByDistrict";
import { Link, Button } from "@heroui/react";
import { FaArrowLeft } from "react-icons/fa6";

interface PlaceDistrictCardListProps {
  district: string;
}

/**
 * คอมโพเนนต์แสดงรายการสถานที่ท่องเที่ยวตามตำบล
 * ใช้ hook usePlacesByDistrict เพื่อดึงข้อมูลสถานที่ท่องเที่ยวตามตำบล
 */
export default function PlaceDistrictCardList(props: PlaceDistrictCardListProps) {
  const { district } = props;
  const { places, isLoading, isError } = usePlacesByDistrict(district);

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
        <Button
          as={Link}
          href="/place"
          variant="light"
          color="primary"
          startContent={<FaArrowLeft />}
          className="mt-4"
        >
          กลับไปหน้ารวมสถานที่ท่องเที่ยว
        </Button>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">ไม่พบสถานที่ท่องเที่ยว</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          ขออภัย ยังไม่มีสถานที่ท่องเที่ยวในตำบลนี้
        </p>
        <Button
          as={Link}
          href="/place"
          variant="light"
          color="primary"
          startContent={<FaArrowLeft />}
        >
          กลับไปหน้ารวมสถานที่ท่องเที่ยว
        </Button>
      </div>
    );
  }

  return <PlaceCard places={places} />;
}