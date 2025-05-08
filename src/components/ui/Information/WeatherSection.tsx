// src/components/ui/Information/WeatherSection.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { BiWind } from "react-icons/bi";
import { FaCloud, FaTemperatureHigh } from "react-icons/fa";
import { BsDropletHalf } from "react-icons/bs";
import { WiDaySunny, WiCloudy, WiRain, WiThunderstorm } from "react-icons/wi";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components";

// กำหนด interface สำหรับข้อมูลสภาพอากาศจาก TMD API
interface WeatherData {
  success: boolean;
  currentTime: string;
  location: {
    province: string;
    amphoe: string;
    tambon: string;
  };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    rainForecast: number;
    condition: string;
  };
  today: {
    maxTemperature: number;
    minTemperature: number;
    humidity: number;
    rainForecast: number;
    condition: string;
  };
  daily: Array<{
    date: string;
    maxTemperature: number;
    minTemperature: number;
    humidity: number;
    rainForecast: number;
    condition: string;
  }>;
  hourly: Array<{
    time: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    rainForecast: number;
    condition: string;
  }>;
}

// interface สำหรับ PM2.5
interface AirQuality {
  pm25: number;
  updatedAt: string;
}

export default function WeatherSection() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // เรียก API ข้อมูลคุณภาพอากาศและข้อมูลสภาพอากาศพร้อมกัน
      const [airQualityResponse, weatherResponse] = await Promise.all([
        fetch("/api/airquality"),
        fetch("/api/weather-tmd")
      ]);

      // ตรวจสอบการตอบสนองจาก API คุณภาพอากาศ
      if (!airQualityResponse.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลคุณภาพอากาศได้");
      }

      // ตรวจสอบการตอบสนองจาก API สภาพอากาศ TMD
      if (!weatherResponse.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลสภาพอากาศได้");
      }

      // แปลงข้อมูลคุณภาพอากาศเป็น JSON
      const airQualityData = await airQualityResponse.json();
      
      // แปลงข้อมูลสภาพอากาศเป็น JSON
      const weatherData = await weatherResponse.json();

      if (!weatherData.success) {
        throw new Error(weatherData.message || "ไม่สามารถโหลดข้อมูลสภาพอากาศได้");
      }

      setAirQuality({
        pm25: airQualityData.pm25,
        updatedAt: airQualityData.updatedAt
      });

      setWeatherData(weatherData);

    } catch (err) {
      console.error("Error fetching weather data:", err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // ฟังก์ชันสำหรับแปลงรหัสสภาพอากาศเป็นไอคอน
  const getWeatherIcon = (conditionCode: string | undefined) => {
    if (!conditionCode) return <WiCloudy size={30} />;
    
    // แปลงรหัสสภาพอากาศของ TMD เป็นไอคอนที่เหมาะสม
    switch (conditionCode) {
      case "1": // ท้องฟ้าแจ่มใส
      case "2": // มีเมฆบางส่วน
        return <WiDaySunny size={30} className="text-yellow-500" />;
      case "3": // เมฆเป็นส่วนมาก
      case "4": // มีเมฆมาก
        return <WiCloudy size={30} className="text-gray-500" />;
      case "5": // ฝนตกเล็กน้อย
      case "6": // ฝนปานกลาง
        return <WiRain size={30} className="text-blue-500" />;
      case "7": // ฝนตกหนัก
      case "8": // ฝนฟ้าคะนอง
        return <WiThunderstorm size={30} className="text-indigo-500" />;
      default:
        return <WiCloudy size={30} className="text-gray-500" />;
    }
  };

  // ฟังก์ชันสำหรับแปลงรหัสสภาพอากาศเป็นข้อความ
  const getWeatherConditionText = (conditionCode: string | undefined) => {
    if (!conditionCode) return "ไม่มีข้อมูล";
    
    const conditions: {[key: string]: string} = {
      "1": "ท้องฟ้าแจ่มใส",
      "2": "มีเมฆบางส่วน",
      "3": "เมฆเป็นส่วนมาก",
      "4": "มีเมฆมาก",
      "5": "ฝนตกเล็กน้อย",
      "6": "ฝนปานกลาง",
      "7": "ฝนตกหนัก",
      "8": "ฝนฟ้าคะนอง",
    };
    
    return conditions[conditionCode] || "ไม่มีข้อมูล";
  };

  // แปลงทิศทางลมเป็นข้อความ
  const getWindDirectionText = (degree: number | undefined) => {
    if (degree === undefined) return "ไม่มีข้อมูล";
    
    const directions = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", 
                       "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];
    
    // คำนวณทิศทางลมจากมุม
    const index = Math.round((degree % 360) / 45) % 8;
    return directions[index];
  };

  const airQualityInfo = airQuality ? getAirQualityLevel(airQuality.pm25) : null;

  return (
    <div className="py-8">
      <SectionHeading
        title="สภาพอากาศปัจจุบันในบางกะเจ้า"
        description="ข้อมูลคุณภาพอากาศและสภาพอากาศแบบเรียลไทม์"
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
                  <Button 
                    color="primary" 
                    variant="light" 
                    onClick={fetchData}
                    className="mt-3"
                  >
                    ลองใหม่อีกครั้ง
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-40 h-40 rounded-full flex items-center justify-center border-8 border-zinc-200 dark:border-zinc-800">
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

        {/* การ์ดข้อมูลสภาพอากาศ */}
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
                <p className="text-small text-default-500">
                  {loading ? "กำลังโหลดข้อมูล..." : error ? "ไม่พบข้อมูล" : `อัปเดตล่าสุด: ${new Date(weatherData?.currentTime || "").toLocaleString('th-TH')}`}
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
                  <Button 
                    color="primary" 
                    variant="light" 
                    onClick={fetchData}
                    className="mt-3"
                  >
                    ลองใหม่อีกครั้ง
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-default-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaTemperatureHigh className="text-orange-500" />
                      <span className="font-semibold">อุณหภูมิ</span>
                    </div>
                    <p className="text-2xl font-bold">{weatherData?.current?.temperature || "N/A"}°C</p>
                    <p className="text-sm text-default-500">
                      รู้สึกเหมือน {Math.round((weatherData?.current?.temperature || 0) * 1.1)}°C
                    </p>
                  </div>

                  <div className="p-4 bg-default-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BsDropletHalf className="text-blue-500" />
                      <span className="font-semibold">ความชื้น</span>
                    </div>
                    <p className="text-2xl font-bold">{weatherData?.current?.humidity || "N/A"}%</p>
                    <p className="text-sm text-default-500">
                      {weatherData?.current?.humidity && weatherData.current.humidity > 70 
                        ? "ค่อนข้างสูง" 
                        : weatherData?.current?.humidity && weatherData.current.humidity < 40 
                        ? "ค่อนข้างต่ำ" 
                        : "ปานกลาง"}
                    </p>
                  </div>

                  <div className="p-4 bg-default-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BiWind className="text-cyan-500" />
                      <span className="font-semibold">ความเร็วลม</span>
                    </div>
                    <p className="text-2xl font-bold">{weatherData?.current?.windSpeed || "N/A"} km/h</p>
                    <p className="text-sm text-default-500">
                      ทิศ{getWindDirectionText(weatherData?.current?.windDirection)}
                    </p>
                  </div>

                  <div className="p-4 bg-default-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-gray-500">
                        {getWeatherIcon(weatherData?.current?.condition)}
                      </div>
                      <span className="font-semibold">สภาพอากาศ</span>
                    </div>
                    <p className="text-xl font-bold">
                      {getWeatherConditionText(weatherData?.current?.condition)}
                    </p>
                    <p className="text-sm text-default-500">
                      สูงสุด {weatherData?.today?.maxTemperature || "N/A"}°C | 
                      ต่ำสุด {weatherData?.today?.minTemperature || "N/A"}°C
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* ส่วนของการพยากรณ์อากาศในอนาคต - สามารถเพิ่มเติมได้ */}
      {!loading && !error && weatherData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <Card shadow="sm">
            <CardHeader>
              <div className="flex gap-3">
                <FaCloud className="text-primary-color text-2xl" />
                <p className="text-md font-bold">พยากรณ์อากาศ 7 วัน</p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                {weatherData.daily.map((day, index) => (
                  <div key={index} className="flex flex-col items-center p-3 rounded-lg bg-default-50">
                    <p className="text-sm font-medium">
                      {new Date(day.date).toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="my-2">
                      {getWeatherIcon(day.condition)}
                    </div>
                    <p className="text-sm font-bold">{day.maxTemperature}°C</p>
                    <p className="text-xs text-default-500">{day.minTemperature}°C</p>
                    <p className="text-xs mt-1">{getWeatherConditionText(day.condition)}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </div>
  );
}