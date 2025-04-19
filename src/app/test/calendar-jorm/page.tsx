"use client";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th"; // สำหรับแสดงภาษาไทย
dayjs.locale("th");

const API_KEY = "AIzaSyA8n4zPGCmsywdB98QFwsExKv7gkTasDO0";
const CALENDAR_ID = "thesis.bangkachao.64@gmail.com";

type CalendarEvent = {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
};

export default function Page() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month());
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

  useEffect(() => {
    const fetchEvents = async () => {
      const timeMin = dayjs(`${selectedYear}-${selectedMonth + 1}-01`).startOf("month").toISOString();
      const timeMax = dayjs(`${selectedYear}-${selectedMonth + 1}-01`).endOf("month").toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
      );
      const data = await response.json();
      setEvents(data.items || []);
    };
    fetchEvents();
  }, [selectedMonth, selectedYear]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">ปฏิทินกิจกรรม</h1>

      {/* Selector */}
      <div className="flex justify-center gap-3 mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="p-2 border rounded-md shadow-sm"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {dayjs().month(i).format("MMMM")}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="p-2 border rounded-md shadow-sm"
        >
          {[2024, 2025, 2026].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Event List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-center text-gray-500">ไม่มีกิจกรรมในเดือนนี้</p>
        ) : (
          events.map((event) => {
            const date = dayjs(event.start.dateTime || event.start.date);
            const day = date.format("D");
            const monthYear = date.format("MMMM YYYY");

            return (
              <div
                key={event.id}
                className="flex items-center justify-between bg-white rounded-xl shadow p-4 border-l-4 border-green-500"
              >
                <div>
                  <p className="text-lg font-semibold text-gray-800">{event.summary}</p>
                  <p className="text-sm text-gray-500">{monthYear}</p>
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-green-500 rounded-lg px-4 py-2">
                <span className="text-sm text-green-600">วันที่</span>
                  <span className="text-3xl font-bold text-green-600 leading-tight">{day}</span>
                  
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
