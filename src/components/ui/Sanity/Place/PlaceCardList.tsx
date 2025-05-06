// src/components/ui/Sanity/Place/PlaceCardList.tsx
"use client";

import React, { useState, useCallback } from "react";
import { Loading, PlaceCard, SearchBar } from "@/components";
import { usePlaces } from "@/hooks/usePlaces";
import { Button } from "@heroui/react";
import { Place } from "@/lib/sanity/schema";

interface PlaceCardListProps {
  type?: string;
  showSearchBar?: boolean; // เพิ่ม prop ใหม่
}

export default function PlaceCardList({ type, showSearchBar = true }: PlaceCardListProps) {
  const { places, isLoading, isError } = usePlaces(type);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // ฟังก์ชันค้นหา
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
    
    if (!query.trim()) {
      // ล้างการค้นหา กลับไปแสดงทั้งหมด
      setFilteredPlaces([]);
      setHasSearched(false);
      return;
    }
    
    // กรองสถานที่ตามชื่อหรือคำอธิบาย
    const lowerCaseQuery = query.toLowerCase();
    const filtered = places.filter(place => 
      place.title.toLowerCase().includes(lowerCaseQuery) || 
      (place.description && place.description.toLowerCase().includes(lowerCaseQuery))
    );
    
    setFilteredPlaces(filtered);
  }, [places]);

  // ในกรณีที่โหลดข้อมูลใหม่ แต่ไม่ได้มีการค้นหา
  React.useEffect(() => {
    if (places && !hasSearched) {
      setFilteredPlaces([]);
    } else if (places && hasSearched && searchQuery) {
      // อัปเดตผลการค้นหาหากมีข้อมูลใหม่
      handleSearch(searchQuery);
    }
  }, [places, hasSearched, searchQuery, handleSearch]);

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

  return (
    <div>
      {showSearchBar && ( // เพิ่มเงื่อนไขการแสดง SearchBar
        <div className="mb-6">
          <SearchBar 
            onSearch={handleSearch}
            contentType="place"
          />
          
          {hasSearched && searchQuery && (
            <div className="mt-3 mb-5 bg-zinc-100/70 dark:bg-zinc-800/70 px-4 py-2 rounded-lg flex justify-between items-center">
              <div>
                <span>ผลการค้นหา: </span>
                <span className="font-bold">{filteredPlaces.length}</span> จาก <span className="font-bold">{places.length}</span> สถานที่
                {searchQuery && <span> สำหรับ &quot;<span className="font-semibold text-primary-color">{searchQuery}</span>&quot;</span>}
              </div>
              
              {filteredPlaces.length === 0 && (
                <div className="text-zinc-500">ไม่พบผลลัพธ์</div>
              )}
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
          <h2 className="text-2xl font-bold mb-4">ไม่พบสถานที่ท่องเที่ยว</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            ไม่พบสถานที่ท่องเที่ยวสำหรับคำค้นหา &quot;{searchQuery}&quot;
          </p>
          <Button color="primary" onPress={() => handleSearch("")}>
            แสดงสถานที่ท่องเที่ยวทั้งหมด
          </Button>
        </div>
      )}
    </div>
  );
}