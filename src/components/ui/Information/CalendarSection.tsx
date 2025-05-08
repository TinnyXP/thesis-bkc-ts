// src/components/ui/Information/CalendarSection.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaClock, FaAngleLeft, FaAngleRight } from "react-icons/fa";
import {
  Card,
  CardBody,
  Select,
  SelectItem,
  Chip,
  Button,
  Divider,
  type Selection
} from "@heroui/react";
import { Loading } from "@/components";

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
}

export default function CalendarSection() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month());
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate year range for dropdown
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Fetch events function using useCallback
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const timeMin = dayjs(`${selectedYear}-${selectedMonth + 1}-01`)
        .startOf("month")
        .toISOString();

      const timeMax = dayjs(`${selectedYear}-${selectedMonth + 1}-01`)
        .endOf("month")
        .toISOString();

      const response = await fetch(`/api/calendar?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);

      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลได้");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Change month handler using useCallback
  const handleMonthChange = useCallback((direction: "prev" | "next") => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (direction === "prev") {
      if (selectedMonth === 0) {
        newMonth = 11;
        newYear = selectedYear - 1;
      } else {
        newMonth = selectedMonth - 1;
      }
    } else {
      if (selectedMonth === 11) {
        newMonth = 0;
        newYear = selectedYear + 1;
      } else {
        newMonth = selectedMonth + 1;
      }
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  }, [selectedMonth, selectedYear]);

  // เปลี่ยนฟังก์ชันการจัดการ Select ให้ใช้ useCallback
  const handleMonthSelectionChange = useCallback((key: Selection) => {
    const selectedKey = key as Set<string>;
    if (selectedKey.size > 0) {
      setSelectedMonth(Number(Array.from(selectedKey)[0]));
    }
  }, []);

  const handleYearSelectionChange = useCallback((key: Selection) => {
    const selectedKey = key as Set<string>;
    if (selectedKey.size > 0) {
      setSelectedYear(Number(Array.from(selectedKey)[0]));
    }
  }, []);

  // Run on component mount and when month/year changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Format time display
  const formatTime = (dateTimeStr?: string): string => {
    if (!dateTimeStr) return "";
    return dayjs(dateTimeStr).format("HH:mm");
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">ปฏิทินกิจกรรม</h2>
        <p className="text-default-500">กิจกรรมและเหตุการณ์ในบางกะเจ้า</p>
      </div>

      {/* Month and Year Selector */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-primary text-lg" />
              <h2 className="text-xl font-medium">
                {dayjs().month(selectedMonth).format("MMMM")} {selectedYear}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                variant="light"
                onClick={() => handleMonthChange("prev")}
                aria-label="Previous month"
              >
                <FaAngleLeft />
              </Button>

              <div className="flex gap-2">
                <Select
                  label="เดือน"
                  selectedKeys={[selectedMonth.toString()]}
                  className="w-40"
                  onSelectionChange={handleMonthSelectionChange}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i.toString()} textValue={dayjs().month(i).format("MMMM")}>
                      {dayjs().month(i).format("MMMM")}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="ปี"
                  selectedKeys={[selectedYear.toString()]}
                  className="w-32"
                  onSelectionChange={handleYearSelectionChange}
                >
                  {yearOptions.map((year) => (
                    <SelectItem key={year.toString()} textValue={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Button
                isIconOnly
                variant="light"
                onClick={() => handleMonthChange("next")}
                aria-label="Next month"
              >
                <FaAngleRight />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

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
              onClick={fetchEvents}
            >
              ลองใหม่อีกครั้ง
            </Button>
          </motion.div>
        ) : events.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center my-16"
          >
            <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-500">ไม่มีกิจกรรมในเดือนนี้</h3>
            <p className="text-gray-400 mt-2">กรุณาเลือกเดือนอื่น หรือเพิ่มกิจกรรมใหม่</p>
          </motion.div>
        ) : (
          <motion.div
            key="events-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {events.map((event, index) => {
              const date = dayjs(event.start.dateTime || event.start.date);
              const day = date.format("D");
              const month = date.format("MMMM");
              const dayOfWeek = date.format("dddd");
              const hasTime = Boolean(event.start.dateTime);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardBody className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="flex flex-col items-center justify-center bg-primary-100 p-4 sm:p-6 sm:w-32">
                          <motion.span
                            className="text-sm font-medium text-primary-600"
                            whileHover={{ scale: 1.05 }}
                          >
                            {dayOfWeek}
                          </motion.span>
                          <motion.div
                            className="text-4xl font-bold text-primary"
                            whileHover={{ scale: 1.1 }}
                          >
                            {day}
                          </motion.div>
                          <span className="text-sm text-primary-600">{month}</span>
                        </div>

                        <div className="flex-1 p-4">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.summary}</h3>

                          {event.description && (
                            <p className="text-gray-600 text-sm mb-3">
                              {event.description.length > 100
                                ? `${event.description.substring(0, 100)}...`
                                : event.description}
                            </p>
                          )}

                          {hasTime && (
                            <div className="flex items-center mt-2">
                              <FaClock className="text-gray-400 mr-2" size={14} />
                              <span className="text-sm text-gray-500">
                                {formatTime(event.start.dateTime)} - {formatTime(event.end?.dateTime)}
                              </span>
                            </div>
                          )}

                          <Divider className="my-3" />

                          <div className="flex justify-between items-center">
                            <Chip size="sm" color="primary" variant="flat">กิจกรรม</Chip>
                            <Button
                              size="sm"
                              color="primary"
                              variant="light"
                              className="text-xs"
                            >
                              ดูรายละเอียด
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}