"use client";

import React, { Suspense } from "react";
import { PageHeader, Loading } from "@/components";
import { Tabs, Tab, Button } from "@heroui/react";
import { FaCalendarAlt, FaCloud } from "react-icons/fa";

// Import components lazily to avoid loading them during build time
const WeatherSection = React.lazy(() => import('@/components/ui/Information/WeatherSection'));
const CalendarSection = React.lazy(() => import('@/components/ui/Information/CalendarSection'));

export default function InformationPage() {
  const [selectedKey, setSelectedKey] = React.useState<string>("weather");

  return (
    <>
      <PageHeader
        title="ข้อมูลเกี่ยวกับบางกะเจ้า"
        subtitle="ข้อมูล"
        description="รวมข้อมูลที่น่าสนใจเกี่ยวกับบางกะเจ้า ปอดสีเขียวแห่งกรุงเทพฯ"
      >
        <div className="flex flex-wrap justify-start gap-3">
          <Button
            color={selectedKey === "weather" ? "primary" : "default"}
            variant={selectedKey === "weather" ? "bordered" : "solid"}
            className="bg-white/10 backdrop-blur-sm font-semibold text-white justify-center"
            startContent={<FaCloud />}
            onPress={() => setSelectedKey("weather")}
          >
            สภาพอากาศ
          </Button>
          <Button
            color={selectedKey === "calendar" ? "primary" : "default"}
            variant={selectedKey === "calendar" ? "bordered" : "solid"}
            className="bg-white/10 backdrop-blur-sm font-semibold text-white justify-center"
            startContent={<FaCalendarAlt />}
            onPress={() => setSelectedKey("calendar")}
          >
            ปฏิทินกิจกรรม
          </Button>
        </div>
      </PageHeader>

      <main className="container max-w-5xl mx-auto px-4 py-12">
        <div className="mt-4 mb-4">
          <Tabs
            aria-label="ข้อมูลและบริการ"
            selectedKey={selectedKey}
            onSelectionChange={(key) => setSelectedKey(key as string)}
            color="primary"
            variant="solid"
            fullWidth
          >
            <Tab
              key="weather"
              title={
                <div className="flex items-center justify-center gap-2 w-full">
                  <FaCloud />
                  <span>สภาพอากาศ</span>
                </div>
              }
            >
              <Suspense fallback={<Loading message="กำลังโหลดข้อมูลสภาพอากาศ..." />}>
                <WeatherSection />
              </Suspense>
            </Tab>
            <Tab
              key="calendar"
              title={
                <div className="flex items-center justify-center gap-2 w-full">
                  <FaCalendarAlt />
                  <span>ปฏิทินกิจกรรม</span>
                </div>
              }
            >
              <Suspense fallback={<Loading message="กำลังโหลดข้อมูลปฏิทิน..." />}>
                <CalendarSection />
              </Suspense>
            </Tab>
          </Tabs>
        </div>
      </main>
    </>
  );
}