// src/components/ui/Information/CalendarSection.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaClock, FaAngleDown } from "react-icons/fa";
import {
  Card,
  CardBody,
  Select,
  SelectItem,
  Chip,
  Button,
  Accordion,
  AccordionItem,
  type Selection
} from "@heroui/react";
import { Loading, SectionHeading } from "@/components";

// ให้รองรับภาษาไทย
dayjs.locale("th");

// Types
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  eventType?: string;
}

interface MonthlyEvents {
  [month: string]: {
    [date: string]: CalendarEvent[];
  };
}

export default function CalendarSection() {
  const [yearlyEvents, setYearlyEvents] = useState<MonthlyEvents>({});
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // สร้างตัวเลือกปี (ปีปัจจุบัน และ 2 ปีถัดไป)
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear + i);

  // ดึงข้อมูลทั้งปี
  const fetchYearlyEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // สร้างข้อมูลกิจกรรมเปล่าสำหรับทุกเดือน
      const emptyMonthlyEvents: MonthlyEvents = {};
      for (let month = 0; month < 12; month++) {
        const monthKey = dayjs().year(selectedYear).month(month).format("YYYY-MM");
        emptyMonthlyEvents[monthKey] = {};
      }
      
      // ดึงข้อมูลทั้งปี
      const timeMin = dayjs(`${selectedYear}-01-01`).startOf("year").toISOString();
      const timeMax = dayjs(`${selectedYear}-12-31`).endOf("year").toISOString();

      const response = await fetch(`/api/calendar?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);

      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลได้");
      }

      const data = await response.json();
      
      // สร้างประเภทกิจกรรมตัวอย่าง
      const eventsWithType = (data.events || []).map((event: CalendarEvent) => ({
        ...event,
        eventType: getRandomEventType()
      }));
      
      // จัดกลุ่มกิจกรรมตามเดือนและวันที่
      const monthlyEvents = groupEventsByMonthAndDate(eventsWithType);
      
      // รวมกับข้อมูลเปล่าที่สร้างไว้
      setYearlyEvents({...emptyMonthlyEvents, ...monthlyEvents});
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setYearlyEvents({});
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  // สุ่มประเภทกิจกรรม (สำหรับตัวอย่างเท่านั้น)
  const getRandomEventType = () => {
    const types = ["วันหยุดราชการ", "วันหยุดธนาคาร", "กิจกรรมชุมชน", "เทศกาล"];
    return types[Math.floor(Math.random() * types.length)];
  };

  // จัดกลุ่มกิจกรรมตามเดือนและวันที่
  const groupEventsByMonthAndDate = (eventsList: CalendarEvent[]): MonthlyEvents => {
    const result: MonthlyEvents = {};
    
    eventsList.forEach(event => {
      const date = dayjs(event.start.dateTime || event.start.date);
      const monthKey = date.format("YYYY-MM");
      const dateKey = date.format("YYYY-MM-DD");
      
      if (!result[monthKey]) {
        result[monthKey] = {};
      }
      
      if (!result[monthKey][dateKey]) {
        result[monthKey][dateKey] = [];
      }
      
      result[monthKey][dateKey].push(event);
    });
    
    return result;
  };

  // ดึงข้อมูลเมื่อเปลี่ยนปี
  const handleYearSelectionChange = useCallback((key: Selection) => {
    const selectedKey = key as Set<string>;
    if (selectedKey.size > 0) {
      setSelectedYear(Number(Array.from(selectedKey)[0]));
    }
  }, []);

  // รัน fetchYearlyEvents เมื่อเริ่มต้นหรือเมื่อปีเปลี่ยน
  useEffect(() => {
    fetchYearlyEvents();
  }, [fetchYearlyEvents]);

  // จัดรูปแบบเวลา
  const formatTime = (dateTimeStr?: string): string => {
    if (!dateTimeStr) return "";
    return dayjs(dateTimeStr).format("HH:mm");
  };

  // แปลงเลขเดือนเป็นชื่อเดือนภาษาไทย
  const getThaiMonthName = (monthKey: string): string => {
    const [year, month] = monthKey.split("-");
    const date = dayjs(`${year}-${month}-01`);
    return `${date.format("MMMM")} ${parseInt(year) + 543}`;
  };

  // สร้างชื่อวันและเดือนแบบไทย
  const formatDateHeader = (dateStr: string): string => {
    const date = dayjs(dateStr);
    return `วัน${date.format("dddd")}ที่ ${date.format("D")}`;
  };

  // สร้างสีของ chip ตามประเภทกิจกรรม
  const getEventTypeColor = (type?: string): "primary" | "success" | "warning" | "danger" => {
    switch (type) {
      case "วันหยุดราชการ": return "danger";
      case "วันหยุดธนาคาร": return "primary";
      case "กิจกรรมชุมชน": return "success";
      case "เทศกาล": return "warning";
      default: return "primary";
    }
  };

  // ตรวจสอบว่าเดือนมีกิจกรรมหรือไม่
  const hasEventsInMonth = (monthEvents: Record<string, CalendarEvent[]>): boolean => {
    return Object.keys(monthEvents).length > 0;
  };

  return (
    <div className="py-8">
      <SectionHeading
        title="ปฏิทินวันหยุดและกิจกรรมบางกะเจ้า"
        description="วันสำคัญ กิจกรรม และเทศกาลในพื้นที่บางกะเจ้า"
        icon={<FaCalendarAlt className="text-primary-color" />}
      />

      {/* Year Selector */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-primary-color text-lg" />
              <h2 className="text-xl font-medium">
                ปฏิทินกิจกรรมประจำปี {selectedYear + 543}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Select
                label="ปี"
                selectedKeys={[selectedYear.toString()]}
                className="w-40"
                onSelectionChange={handleYearSelectionChange}
              >
                {yearOptions.map((year) => (
                  <SelectItem key={year.toString()} textValue={(year + 543).toString()}>
                    {year + 543}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* คำอธิบายสัญลักษณ์ */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Chip color="danger" variant="flat">วันหยุดราชการ</Chip>
        <Chip color="primary" variant="flat">วันหยุดธนาคาร</Chip>
        <Chip color="success" variant="flat">กิจกรรมชุมชน</Chip>
        <Chip color="warning" variant="flat">เทศกาล</Chip>
      </div>

      {/* Events List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center my-16"
          >
            <Loading />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center my-8 p-4 rounded-lg bg-danger-50 text-danger"
          >
            <p>{error}</p>
            <Button
              color="primary"
              variant="flat"
              className="mt-4"
              onClick={fetchYearlyEvents}
            >
              ลองใหม่อีกครั้ง
            </Button>
          </motion.div>
        ) : Object.keys(yearlyEvents).length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center my-16"
          >
            <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-500">ไม่มีกิจกรรมในปีนี้</h3>
            <p className="text-gray-400 mt-2">กรุณาเลือกปีอื่น หรือเพิ่มกิจกรรมใหม่</p>
          </motion.div>
        ) : (
          <motion.div
            key="events-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <Accordion
              variant="bordered"
              selectionMode="multiple" 
              defaultExpandedKeys={[dayjs().format("YYYY-MM")]} // เปิดเดือนปัจจุบันเป็นค่าเริ่มต้น
              className="px-0 border-none"
              showDivider={false}
              itemClasses={{
                base: "py-0 w-full border border-default-200 rounded-lg mb-4 overflow-hidden",
                title: "font-semibold text-xl",
                trigger: "px-4 py-3 data-[hover=true]:bg-default-100 h-16 flex items-center",
                indicator: "text-medium text-default-400",
                content: "px-4 pt-0 pb-4"
              }}
            >
              {Object.keys(yearlyEvents)
                .sort()
                .map((monthKey) => {
                  const monthEvents = yearlyEvents[monthKey];
                  const hasEvents = hasEventsInMonth(monthEvents);
                  
                  // แสดงเฉพาะเดือนที่มีกิจกรรม
                  return (
                    <AccordionItem
                      key={monthKey}
                      aria-label={getThaiMonthName(monthKey)}
                      title={getThaiMonthName(monthKey)}
                      indicator={<FaAngleDown />}
                      classNames={{
                        title: hasEvents ? "text-primary" : "text-default-500",
                        trigger: hasEvents ? "bg-primary-50/50" : "bg-default-50",
                      }}
                      startContent={
                        <div className={`${hasEvents ? "bg-primary-100 text-primary" : "bg-default-100 text-default-400"} w-12 h-12 rounded-full flex items-center justify-center mr-3 font-bold`}>
                          {parseInt(monthKey.split("-")[1])}
                        </div>
                      }
                      subtitle={
                        <div className="flex gap-1 flex-wrap">
                          {hasEvents ? (
                            <Chip size="sm" color="primary" variant="flat">
                              มีกิจกรรม
                            </Chip>
                          ) : (
                            <Chip size="sm" variant="flat">
                              ไม่มีกิจกรรม
                            </Chip>
                          )}
                        </div>
                      }
                    >
                      {hasEvents ? (
                        <div className="space-y-4">
                          {Object.keys(monthEvents)
                            .sort()
                            .map((dateKey) => (
                              <Card 
                                key={dateKey}
                                className="border-1 border-default-200"
                              >
                                <CardBody className="p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-primary-100 text-primary w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                      {dayjs(dateKey).format("D")}
                                    </div>
                                    <h3 className="text-lg font-medium">{formatDateHeader(dateKey)}</h3>
                                  </div>
                                  
                                  <div className="space-y-3 pl-12">
                                    {monthEvents[dateKey].map((event, index) => (
                                      <div 
                                        key={`${dateKey}-${index}`}
                                        className="border-l-4 pl-3 py-1"
                                        style={{ 
                                          borderColor: event.eventType === "วันหยุดราชการ" ? "var(--heroui-danger)" 
                                            : event.eventType === "วันหยุดธนาคาร" ? "var(--heroui-primary)" 
                                            : event.eventType === "กิจกรรมชุมชน" ? "var(--heroui-success)" 
                                            : "var(--heroui-warning)" 
                                        }}
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <Chip 
                                            size="sm" 
                                            color={getEventTypeColor(event.eventType)} 
                                            variant="flat"
                                          >
                                            {event.eventType}
                                          </Chip>
                                          {event.start.dateTime && (
                                            <div className="flex items-center text-xs text-default-500">
                                              <FaClock className="mr-1" size={10} />
                                              <span>
                                                {formatTime(event.start.dateTime)} - {formatTime(event.end?.dateTime)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <h4 className="text-md font-semibold">{event.summary}</h4>
                                        {/* {event.description && (
                                          <p className="text-sm text-default-600 mt-1">{event.description}</p>
                                        )} */}
                                        {event.location && (
                                          <p className="text-xs text-default-500 mt-1">
                                            <strong>สถานที่:</strong> {event.location}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </CardBody>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-default-500">
                          <p>ไม่มีกิจกรรมในเดือนนี้</p>
                        </div>
                      )}
                    </AccordionItem>
                  );
                })}
            </Accordion>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}