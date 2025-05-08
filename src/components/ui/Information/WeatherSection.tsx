// src/app/(tab)/information/sections/WeatherSection.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { BiWind } from "react-icons/bi";
import { FaCloud, FaTemperatureHigh } from "react-icons/fa";
import { BsDropletHalf } from "react-icons/bs";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components";

interface AirQuality {
  pm25: number;
  updatedAt: string;
}

export default function WeatherSection() {
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/weather");

        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลสภาพอากาศได้");
        }

        const data = await response.json();

        setAirQuality({
          pm25: data.pm25,
          updatedAt: data.updatedAt
        });

      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // คำนวณระดับคุณภาพอากาศและสีที่เกี่ยวข้อง
  const getAirQualityLevel = (pm25: number) => {
    if (pm25 <= 25) return { level: "ดีมาก", color: "bg-green-500", textColor: "text-green-500" };
    if (pm25 <= 50) return { level: "ดี", color: "bg-primary-color/70", textColor: "text-primary-color/70" };
    if (pm25 <= 100) return { level: "ปานกลาง", color: "bg-yellow-500", textColor: "text-yellow-500" };
    if (pm25 <= 200) return { level: "แย่", color: "bg-orange-500", textColor: "text-orange-500" };
    return { level: "อันตราย", color: "bg-red-600", textColor: "text-red-600" };
  };

  const airQualityInfo = airQuality ? getAirQualityLevel(airQuality.pm25) : null;

  return (
    <div className="py-8">
      {/* <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">สภาพอากาศปัจจุบันในบางกะเจ้า</h2>
        <p className="text-default-500">ข้อมูลคุณภาพอากาศแบบเรียลไทม์</p>
      </div> */}

      <SectionHeading
        title="สภาพอากาศปัจจุบันในบางกะเจ้า"
        // subtitle="ข้อมูลสำหรับผู้ใช้"
        description="ข้อมูลคุณภาพอากาศแบบเรียลไทม์"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* การ์ดคุณภาพอากาศ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card shadow="sm" className="h-full">
            <CardHeader className="flex gap-3">
              <FaCloud className="text-primary-color text-2xl" />
              <div className="flex flex-col">
                <p className="text-md font-bold">คุณภาพอากาศ</p>
                <p className="text-small text-default-500">
                  {loading ? "กำลังโหลดข้อมูล..." : error ? "ไม่พบข้อมูล" : `อัปเดตล่าสุด: ${new Date(airQuality?.updatedAt || "").toLocaleString('th-TH')}`}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
                </div>
              ) : error ? (
                <div className="text-center text-danger h-48 flex flex-col items-center justify-center">
                  <p className="mb-2">{error}</p>
                  <p className="text-sm">โปรดลองใหม่อีกครั้งในภายหลัง</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-40 h-40 rounded-full flex items-center justify-center border-8 border-gray-200">
                      <div className={`w-32 h-32 rounded-full ${airQualityInfo?.color} flex items-center justify-center text-white`}>
                        <div className="text-center">
                          <p className="text-6xl font-bold">{airQuality?.pm25}</p>
                          <p className="text-sm">µg/m³</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-semibold mb-2">
                    PM 2.5: <span className={airQualityInfo?.textColor}>{airQuality?.pm25} µg/m³</span>
                  </p>
                  <p className="text-xl mb-4">
                    คุณภาพอากาศ: <span className={`font-bold ${airQualityInfo?.textColor}`}>{airQualityInfo?.level}</span>
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        {/* การ์ดข้อมูลเพิ่มเติม */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card shadow="sm" className="h-full">
            <CardHeader className="flex gap-3">
              <FaTemperatureHigh className="text-primary-color text-2xl" />
              <div className="flex flex-col">
                <p className="text-md font-bold">ข้อมูลสภาพอากาศ</p>
                <p className="text-small text-default-500">ข้อมูลอื่นๆ ที่เกี่ยวข้อง</p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-default-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FaTemperatureHigh className="text-orange-500" />
                    <span className="font-semibold">อุณหภูมิ</span>
                  </div>
                  <p className="text-2xl font-bold">32°C</p>
                  <p className="text-sm text-default-500">รู้สึกเหมือน 34°C</p>
                </div>

                <div className="p-4 bg-default-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BsDropletHalf className="text-blue-500" />
                    <span className="font-semibold">ความชื้น</span>
                  </div>
                  <p className="text-2xl font-bold">65%</p>
                  <p className="text-sm text-default-500">ค่อนข้างสูง</p>
                </div>

                <div className="p-4 bg-default-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BiWind className="text-cyan-500" />
                    <span className="font-semibold">ความเร็วลม</span>
                  </div>
                  <p className="text-2xl font-bold">10 km/h</p>
                  <p className="text-sm text-default-500">ทิศตะวันออกเฉียงใต้</p>
                </div>

                <div className="p-4 bg-default-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCloud className="text-gray-500" />
                    <span className="font-semibold">ปริมาณเมฆ</span>
                  </div>
                  <p className="text-2xl font-bold">30%</p>
                  <p className="text-sm text-default-500">บางเบา</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}