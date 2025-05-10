// src/components/ui/Information/CalendarSection.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaClock, FaAngleDown, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  Card,
  CardBody,
  Chip,
  Button,
  Accordion,
  AccordionItem
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

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  yearRange?: number; // จำนวนปีที่ต้องการให้เลื่อนได้ในแต่ละทิศทาง
}

interface MonthAccordionProps {
  yearlyEvents: MonthlyEvents;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface DayCardProps {
  dateKey: string;
  events: CalendarEvent[];
}

interface EventItemProps {
  event: CalendarEvent;
}

// ====================== Helper Functions ======================

// แปลงเลขเดือนเป็นชื่อเดือนภาษาไทย (ไม่มีเลขปีต่อท้าย)
const getThaiMonthName = (monthKey: string): string => {
  const [, month] = monthKey.split("-"); // ใช้ comma เพื่อข้ามค่าแรกไป
  const date = dayjs(`2000-${month}-01`); // ใช้ปีอะไรก็ได้ เพราะเราจะเอาแค่ชื่อเดือน
  return date.format("MMMM");
};

// สร้างชื่อวันและเดือนแบบไทย
const formatDateHeader = (dateStr: string): string => {
  const date = dayjs(dateStr);
  return `วัน${date.format("dddd")}ที่ ${date.format("D")}`;
};

// จัดรูปแบบเวลา
const formatTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return "";
  return dayjs(dateTimeStr).format("HH:mm");
};

// ตรวจสอบว่าเดือนมีกิจกรรมหรือไม่
const hasEventsInMonth = (monthEvents: Record<string, CalendarEvent[]>): boolean => {
  return Object.keys(monthEvents).length > 0;
};

// สุ่มประเภทกิจกรรม (สำหรับตัวอย่างเท่านั้น)
const getRandomEventType = (): string => {
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

// ====================== Components ======================

// YearSelector Component
const YearSelector: React.FC<YearSelectorProps> = ({ selectedYear, onYearChange, yearRange = 3 }) => {
  // สร้างตัวเลือกปี (yearRange ปีก่อนและ yearRange ปีถัดไปจากปีปัจจุบัน)
  const currentYear = dayjs().year();
  const minYear = currentYear - yearRange;
  const maxYear = currentYear + yearRange;

  // ฟังก์ชันเลื่อนปีไปทางซ้าย (ปีก่อนหน้า)
  const handlePreviousYear = () => {
    // เลื่อนปีไม่เกินกว่าปีที่กำหนด
    if (selectedYear > minYear) {
      onYearChange(selectedYear - 1);
    }
  };

  // ฟังก์ชันเลื่อนปีไปทางขวา (ปีถัดไป)
  const handleNextYear = () => {
    // เลื่อนปีไม่เกินกว่าปีที่กำหนด
    if (selectedYear < maxYear) {
      onYearChange(selectedYear + 1);
    }
  };

  return (
    <Card className="mb-6">
      <CardBody>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-primary-color text-lg" />
            <h2 className="text-xl font-medium">
              ปฏิทินกิจกรรมประจำปี {selectedYear + 543}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              variant="light"
              color="primary"
              size="sm"
              onPress={handlePreviousYear}
              isDisabled={selectedYear <= minYear}
              className="min-w-8 h-8"
            >
              <FaChevronLeft size={16} />
            </Button>

            <div className="mx-2 w-24 text-center font-bold text-lg">
              {selectedYear + 543}
            </div>

            <Button
              isIconOnly
              variant="light"
              color="primary"
              size="sm"
              onPress={handleNextYear}
              isDisabled={selectedYear >= maxYear}
              className="min-w-8 h-8"
            >
              <FaChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// EventItem Component
const EventItem: React.FC<EventItemProps> = ({ event }) => {
  return (
    <div
      className="border-l-2 border-zinc-200 dark:border-zinc-700 pl-3 py-1 flex items-center justify-between"
    >
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-md font-normal">{event.summary}</h4>
      </div>

      <div className="flex items-center gap-2 mb-1">
        {event.start.dateTime && (
          <div className="flex items-center text-xs text-default-500">
            <FaClock className="mr-1" size={10} />
            <span>
              {formatTime(event.start.dateTime)} - {formatTime(event.end?.dateTime)}
            </span>
          </div>
        )}

        {event.location && (
          <p className="text-xs text-default-500 mt-1">
            <strong>สถานที่:</strong> {event.location}
          </p>
        )}
      </div>

    </div>
  );
};

// DayCard Component ที่แสดง background color ตามวันในสัปดาห์แบบไทย
const DayCard: React.FC<DayCardProps> = ({ dateKey, events }) => {
  // ฟังก์ชันสำหรับกำหนดสีตามวันในสัปดาห์แบบไทย
  const getDayColor = (date: string): string => {
    const day = dayjs(date).day(); // 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์

    switch (day) {
      case 0: // วันอาทิตย์ - สีแดง
        return "bg-red-500 dark:bg-red-600";
      case 1: // วันจันทร์ - สีเหลือง
        return "bg-yellow-500 dark:bg-yellow-600";
      case 2: // วันอังคาร - สีชมพู
        return "bg-pink-500 dark:bg-pink-600";
      case 3: // วันพุธ - สีเขียว
        return "bg-green-500 dark:bg-green-600";
      case 4: // วันพฤหัสบดี - สีส้ม
        return "bg-orange-500 dark:bg-orange-600";
      case 5: // วันศุกร์ - สีฟ้า
        return "bg-cyan-500 dark:bg-cyan-600";
      case 6: // วันเสาร์ - สีม่วง
        return "bg-purple-500 dark:bg-purple-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  return (
    <Card className="bg-white shadow-sm dark:bg-zinc-900/50 border-2 border-zinc-150 dark:border-zinc-900">
      <CardBody className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`${getDayColor(dateKey)} w-3 h-3 rounded-full flex items-center justify-center`}>
          </div>
          <div className="px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <h3 className="text-lg font-medium">{formatDateHeader(dateKey)}</h3>
          </div>
        </div>

        <div className="space-y-0 pl-5">
          {events.map((event, index) => (
            <EventItem key={`${dateKey}-${index}`} event={event} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

// MonthAccordion Component
const MonthAccordion: React.FC<MonthAccordionProps> = ({ yearlyEvents, isLoading, error, onRetry }) => {
  if (isLoading) {
    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-center my-16"
      >
        <Loading />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        key="error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center my-8 p-4 rounded-lg text-danger font-bold"
      >
        <p>{error}</p>
        <Button
          color="primary"
          variant="ghost"
          className="mt-4"
          onClick={onRetry}
        >
          ลองใหม่อีกครั้ง
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="events-list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <Accordion
        variant="splitted"
        selectionMode="multiple"
        defaultExpandedKeys={[dayjs().format("YYYY-MM")]} // เปิดเดือนปัจจุบันเป็นค่าเริ่มต้น
        showDivider={false}
        itemClasses={{
          base: "bg-white shadow-sm dark:bg-zinc-950 border-2 border-zinc-150 dark:border-zinc-900",
        }}
      >
        {Object.keys(yearlyEvents)
          .sort()
          .map((monthKey) => {
            const monthEvents = yearlyEvents[monthKey];
            const hasEvents = hasEventsInMonth(monthEvents);

            return (
              <AccordionItem
                key={monthKey}
                aria-label={getThaiMonthName(monthKey)}
                title={
                  <div className="flex justify-between items-center w-full">
                    <span>{getThaiMonthName(monthKey)}</span>
                    <Chip
                      size="sm"
                      color={hasEvents ? "primary" : "default"}
                      variant="bordered"
                      className="ml-2 min-w-[80px]"
                      classNames={{
                        base: "justify-center",
                        content: "flex-grow-0 font-normal text-zinc-800 dark:text-white"
                      }}
                    >
                      {hasEvents ? "มีกิจกรรม" : "ไม่มีกิจกรรม"}
                    </Chip>
                  </div>
                }
                indicator={<FaAngleDown />}
                classNames={{
                  title: "text-foreground text-lg font-bold w-full",
                }}
                startContent={
                  <div className="rounded-full w-12 h-12 flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-800">
                    <div className="rounded-full w-9 h-9 flex items-center justify-center text-white bg-primary-color/70 font-bold text-lg">
                      {parseInt(monthKey.split("-")[1])}
                    </div>
                  </div>
                }
              >
                {hasEvents ? (
                  <div className="space-y-4">
                    {Object.keys(monthEvents)
                      .sort()
                      .map((dateKey) => (
                        <DayCard
                          key={dateKey}
                          dateKey={dateKey}
                          events={monthEvents[dateKey]}
                        />
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
  );
};

// ====================== Main Component ======================

export default function CalendarSection() {
  const [yearlyEvents, setYearlyEvents] = useState<MonthlyEvents>({});
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchYearlyEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
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
        eventType: event.eventType || getRandomEventType()
      }));

      // จัดกลุ่มกิจกรรมตามเดือนและวันที่
      const monthlyEvents = groupEventsByMonthAndDate(eventsWithType);

      // สร้างโครงสร้างข้อมูลที่มีทุกเดือนของปี
      const fullYearEvents: MonthlyEvents = {};

      // ข้อมูลทุกเดือนในปีที่เลือก
      for (let month = 1; month <= 12; month++) {
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        const monthKey = `${selectedYear}-${monthStr}`;
        // ใช้ข้อมูลจาก API ถ้ามี หรือตั้งเป็นออบเจกต์ว่างถ้าไม่มี
        fullYearEvents[monthKey] = monthlyEvents[monthKey] || {};
      }

      setYearlyEvents(fullYearEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      // ในกรณีมีข้อผิดพลาด ยังคงตั้งค่าให้มีทุกเดือนแต่ไม่มีกิจกรรม
      const emptyEvents: MonthlyEvents = {};
      for (let month = 1; month <= 12; month++) {
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        emptyEvents[`${selectedYear}-${monthStr}`] = {};
      }
      setYearlyEvents(emptyEvents);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  // เรียกใช้ fetchYearlyEvents เมื่อเริ่มต้นหรือเมื่อปีเปลี่ยน
  useEffect(() => {
    fetchYearlyEvents();
  }, [fetchYearlyEvents]);

  // Handler สำหรับการเปลี่ยนปี
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <div className="py-4">
      <SectionHeading
        title="ปฏิทินของพื้นที่บางกะเจ้า"
        description="วันสำคัญ กิจกรรม และเทศกาลในพื้นที่บางกะเจ้า"
        // icon={<FaCalendarAlt className="text-primary-color" />}
      />

      {/* Year Selector */}
      <YearSelector
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        yearRange={5} // สามารถเลื่อนไปได้ 5 ปีในแต่ละทิศทาง
      />

      {/* คำอธิบาย */}
      {/* <div className="mb-6">
        <p className="text-medium text-default-500 mb-2">ปฏิทินกิจกรรมและวันสำคัญของพื้นที่บางกะเจ้า</p>
      </div> */}

      {/* Events List */}
      <AnimatePresence mode="wait">
        <MonthAccordion
          yearlyEvents={yearlyEvents}
          isLoading={isLoading}
          error={error}
          onRetry={fetchYearlyEvents}
        />
      </AnimatePresence>
    </div>
  );
}