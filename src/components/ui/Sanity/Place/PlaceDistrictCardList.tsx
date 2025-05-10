"use client";

import React, { useState, useCallback } from "react";
import { Loading, PlaceCard, SearchBar } from "@/components";
import { usePlacesByDistrict } from "@/hooks/usePlacesByDistrict";
import { Place } from "@/lib/sanity/schema";
import { Link, Button } from "@heroui/react";
import { FaArrowLeft } from "react-icons/fa6";

interface PlaceDistrictCardListProps {
  district: string;
  showSearchBar?: boolean;
}

/**
 * คอมโพเนนต์แสดงรายการสถานที่ท่องเที่ยวตามตำบล
 * ใช้ hook usePlacesByDistrict เพื่อดึงข้อมูลสถานที่ท่องเที่ยวตามตำบล
 */
export default function PlaceDistrictCardList(props: PlaceDistrictCardListProps) {
  const { district, showSearchBar = true } = props;
  const { places, isLoading, isError } = usePlacesByDistrict(district);
  
  // เพิ่ม state สำหรับการค้นหา
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // ฟังก์ชันค้นหา
  const handleSearch = useCallback((query: string) => {
    // อัพเดท state searchQuery ทุกครั้งที่มีการค้นหา
    setSearchQuery(query);
    
    if (!query.trim()) {
      // กรณีค่าว่าง: ล้างการค้นหา กลับไปแสดงทั้งหมด
      setFilteredPlaces([]);
      setHasSearched(false);
      return;
    }
    
    // กรณีมีคำค้นหา: ตั้งค่า hasSearched เป็น true เสมอเมื่อมีการเรียกฟังก์ชัน handleSearch
    setHasSearched(true);
    
    // กรองสถานที่ตามชื่อหรือคำอธิบาย
    const lowerCaseQuery = query.toLowerCase();
    const filtered = places.filter(place => 
      place.title.toLowerCase().includes(lowerCaseQuery) || 
      (place.description && place.description.toLowerCase().includes(lowerCaseQuery))
    );
    
    // อัพเดทผลลัพธ์การค้นหา
    setFilteredPlaces(filtered);
  }, [places]);

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

  return (
    <div>
      {showSearchBar && (
        <div className="mb-6">
          <SearchBar 
            onSearch={handleSearch}
            contentType="place"
          />
          
          {hasSearched && (
            <div className="mt-3 mb-5 bg-transparent px-4 py-2 rounded-lg flex justify-between items-center">
              <div>
                <span>ผลการค้นหา: </span>
                <span className="font-bold">{filteredPlaces.length}</span> จาก <span className="font-bold">{places.length}</span> สถานที่
                {searchQuery && <span> สำหรับ &quot;<span className="font-semibold text-primary-color">{searchQuery}</span>&quot;</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ถ้ายังไม่ได้ค้นหาหรือเคลียร์การค้นหาแล้ว ให้แสดงทั้งหมด */}
      {!hasSearched ? (
        <PlaceCard places={places} />
      ) : filteredPlaces.length > 0 ? (
        <PlaceCard places={filteredPlaces} />
      ) : (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">ไม่พบสถานที่ท่องเที่ยว</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            ไม่พบสถานที่ท่องเที่ยวสำหรับคำค้นหา &quot;{searchQuery}&quot;
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
      )}
    </div>
  );
}