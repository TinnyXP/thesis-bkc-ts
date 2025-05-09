"use client";

import React, { Suspense } from "react";
import { PageHeader, Loading } from "@/components";
import { Tabs, Tab } from "@heroui/react";
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
        buttons={{
          primary: {
            text: "ดูบทความล่าสุด",
            href: "/blog",
            icon: <FaCalendarAlt />
          },
          secondary: {
            text: "ดูสถานที่ท่องเที่ยว",
            href: "/place",
            icon: <FaCloud />
          }
        }}
      />

      <section className="container max-w-5xl mx-auto px-4 py-12">
        <div className="mt-8 mb-12">
          <Tabs
            aria-label="ข้อมูลและบริการ"
            selectedKey={selectedKey}
            onSelectionChange={(key) => setSelectedKey(key as string)}
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary font-medium",
            }}
          >
            <Tab
              key="weather"
              title={
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
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
      </section>
    </>
  );
}