"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody, CardFooter, Chip, Image, Pagination } from "@heroui/react";
import { Place } from '@/lib/sanity/schema';
import { FaMapMarkerAlt, FaClipboardList } from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/th";

// ตั้งค่าภาษาไทยสำหรับ dayjs
dayjs.locale("th");

interface PlaceCardProps {
  places: Place[];
}

/**
 * คอมโพเนนต์แสดงการ์ดสถานที่พร้อมการแบ่งหน้า (client-side)
 */
export default function PlaceCard({ places }: PlaceCardProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cardsPerPage, setCardsPerPage] = useState<number>(6);
  const [currentPlaces, setCurrentPlaces] = useState<Place[]>([]);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(places.length / cardsPerPage);

  // ปรับจำนวนการ์ดต่อหน้าตามขนาดหน้าจอ
  useEffect(() => {
    const updateCardsPerPage = (): void => {
      if (window.innerWidth >= 1024) {
        setCardsPerPage(6); // large screens
      } else if (window.innerWidth >= 768) {
        setCardsPerPage(4); // medium screens
      } else {
        setCardsPerPage(3); // small screens
      }
    };

    // เรียกใช้งานครั้งแรกและเมื่อมีการ resize
    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);

    // Cleanup
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  // อัพเดท places ที่แสดงเมื่อมีการเปลี่ยนหน้าหรือจำนวนการ์ดต่อหน้า
  useEffect(() => {
    const indexOfLastPlace = currentPage * cardsPerPage;
    const indexOfFirstPlace = indexOfLastPlace - cardsPerPage;
    setCurrentPlaces(places.slice(indexOfFirstPlace, indexOfLastPlace));
  }, [currentPage, cardsPerPage, places]);

  // ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
  const formatThaiDate = (date: string | undefined): string => {
    if (!date) return "";
    return dayjs(date).format("D MMMM YYYY");
  };

  // ถ้าไม่มีข้อมูลสถานที่
  if (!places.length) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">ไม่พบสถานที่ท่องเที่ยว</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          ขออภัย ยังไม่มีสถานที่ท่องเที่ยวในหมวดหมู่นี้
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPlaces.map((place) => {
          // ใช้ค่าเริ่มต้นสำหรับประเภทสถานที่และตำบล
          const placeTypeSlug = place.placeType?.slug.current || 'uncategorized';
          const placeTypeTitle = place.placeType?.title || 'ไม่ระบุประเภท';
          const districtTitle = place.district?.title || 'ไม่ระบุตำบล';

          return (
            <Card
              key={place._id}
              isPressable
              isBlurred
              isHoverable
              onPress={() => window.location.href = `/place/${placeTypeSlug}/${place.slug.current}`}
              className="border-none bg-background/60 dark:bg-default-100/50"
            >
              <CardBody className="overflow-visible px-1.5 pt-1.5 pb-0">
                <div className="relative">
                  {place.mainImage?.asset?.url ? (
                    <Image
                      alt={place.title}
                      className="object-cover rounded-xl w-full h-auto aspect-video"
                      src={`${place.mainImage.asset.url}?w=768&auto=format`}
                      width={330}
                      height={180}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-[180px] aspect-video bg-zinc-500/10 rounded-xl flex items-center justify-center">
                      <p className="text-foreground text-sm">ไม่มีรูปภาพ</p>
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex gap-2 z-10">
                    <Chip size="sm" color="primary" variant="solid"
                      classNames={{
                        base: "bg-gradient-to-br from-primary to-emerald-600",
                        content: "text-white",
                      }}
                    >
                      {placeTypeTitle}
                    </Chip>
                  </div>
                  <div className="absolute bottom-1 right-1 flex gap-2 z-10">
                    <Chip size="sm" color="primary" variant="solid"
                      classNames={{
                        base: "bg-zinc-600/75 dark:bg-zinc-800/75 backdrop-blur-sm",
                        content: "text-white",
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt size={12} />
                        <span className="text-xs">
                          {districtTitle}
                        </span>
                      </div>
                    </Chip>
                  </div>
                </div>
              </CardBody>
              <CardFooter className="flex justify-between items-center">
                <div className="flex flex-col text-left">
                  <p className="w-full max-w-[320px] overflow-hidden text-ellipsis text-sm uppercase font-bold">{place.title}</p>

                  {place.description && (
                    <p className="text-xs text-default-500 mt-1 max-w-[320px] text-ellipsis line-clamp-1">
                      {place.description}
                    </p>
                  )}

                  {place.publishedAt && (
                    <div className="flex items-center gap-1">
                      <FaClipboardList size={12} />
                      <span className="text-xs">
                        {formatThaiDate(place.publishedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          variant="light"
          initialPage={1}
          total={totalPages}
          page={currentPage}
          onChange={setCurrentPage}
          classNames={{ item: "box-border" }}
        />
      )}
    </div>
  );
}