"use client";

import { useState, useEffect } from "react";
import { AirQuality } from "@/types";
import { AIR_QUALITY_LEVELS } from "@/constants/ui";

interface WeatherClientProps {
  airQuality: AirQuality;
}

/**
 * คอมโพเนนต์แสดงข้อมูลคุณภาพอากาศ (client-side)
 */
export default function WeatherClient({ airQuality }: WeatherClientProps) {
  const [bgColor, setBgColor] = useState("bg-green-500");
  const [airQualityInfo, setAirQualityInfo] = useState({
    label: "ดี",
    description: "คุณภาพอากาศดี เหมาะสำหรับกิจกรรมกลางแจ้ง"
  });

  useEffect(() => {
    // ระบุระดับคุณภาพอากาศตามค่า PM 2.5
    for (const level of AIR_QUALITY_LEVELS) {
      if (airQuality.pm25 <= level.maxValue) {
        setBgColor(level.color);
        setAirQualityInfo({
          label: level.label,
          description: level.description
        });
        break;
      }
    }
  }, [airQuality.pm25]);

  return (
    <main className={`min-w-screen flex flex-col items-center justify-center ${bgColor} text-white p-5 sm:p-10 rounded-lg shadow-md`}>
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">ข้อมูลคุณภาพอากาศ</h1>
        <p className="text-lg md:text-xl font-semibold mb-2">PM2.5: {airQuality.pm25} μg/m³</p>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mt-3">
          <p className="text-lg font-bold">{airQualityInfo.label}</p>
          <p className="text-sm md:text-base">{airQualityInfo.description}</p>
        </div>
        <p className="text-sm mt-4 opacity-80">
          อัปเดตเมื่อ: {new Date(airQuality.updatedAt).toLocaleString('th-TH')}
        </p>
      </div>
    </main>
  );
}