// src/app/(tab)/place/page.tsx
import React from "react";
import { Metadata } from "next";
import { PageHeader, SectionHeading } from "@/components";
import { getAllPlaceTypes, getAllDistricts } from "@/lib/sanity/placeQueries";
import { PlaceCardList } from "@/components";
import Link from "next/link";
import { Card, CardBody, Divider } from "@heroui/react";
import { FaMapMarkedAlt, FaCompass, FaMap, FaBuilding, FaCamera } from "react-icons/fa";

// Metadata สำหรับหน้ารวมสถานที่ท่องเที่ยว
export const metadata: Metadata = {
  title: "สถานที่ท่องเที่ยว - บางกะเจ้า",
  description: "รวมสถานที่ท่องเที่ยวน่าสนใจในบางกะเจ้า ที่คุณไม่ควรพลาด",
  keywords: "สถานที่ท่องเที่ยว บางกะเจ้า, ที่เที่ยวบางกะเจ้า, แหล่งท่องเที่ยวบางกะเจ้า",
};

export default async function PlacePage() {
  // ดึงข้อมูลประเภทสถานที่และตำบลทั้งหมด
  const placeTypes = await getAllPlaceTypes();
  const districts = await getAllDistricts();

  return (
    <>
      <PageHeader 
        title="สถานที่ท่องเที่ยวในบางกะเจ้า"
        subtitle="แหล่งท่องเที่ยว"
        description="ค้นพบสถานที่ท่องเที่ยวที่น่าสนใจในบางกะเจ้า เพียงไม่กี่นาทีจากใจกลางเมือง"
        buttons={{
          primary: {
            text: "ดูประเภทสถานที่",
            href: "#place-types",
            icon: <FaCompass />
          },
          secondary: {
            text: "ดูตำบล/พื้นที่",
            href: "#districts",
            icon: <FaMap />
          }
        }}
      />

      <div className="container max-w-5xl mx-auto px-4 py-12 sm:px-6">
        <div>
          {/* แสดงประเภทสถานที่ในรูปแบบการ์ด */}
          <section id="place-types" className="mb-12 pt-4 scroll-mt-24">
            <SectionHeading
              title="ประเภทสถานที่"
              subtitle="หมวดหมู่"
              icon={<FaCompass className="text-primary-color" />}
              description="เลือกดูสถานที่ท่องเที่ยวตามประเภทที่คุณสนใจ"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {placeTypes.map((type) => (
                <Card
                  key={type._id}
                  isPressable
                  isHoverable
                  as={Link}
                  href={`/place/type/${type.slug.current}`}
                  className="border-none shadow-md"
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary-color/10 dark:bg-primary-color/20 flex items-center justify-center flex-shrink-0">
                        {type.icon ? (
                          <span className="text-primary-color text-lg">{type.icon}</span>
                        ) : (
                          <FaCamera className="text-primary-color text-lg" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{type.title}</h3>
                        {type.description && (
                          <p className="text-default-500 text-sm line-clamp-1">
                            {type.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
          
          <Divider className="my-12" />
          
          {/* แสดงตำบล/พื้นที่ในรูปแบบการ์ด */}
          <section id="districts" className="mb-12 scroll-mt-24">
            <SectionHeading
              title="พื้นที่ในบางกะเจ้า"
              subtitle="ตำบล"
              icon={<FaMap className="text-emerald-600" />}
              description="ค้นพบสถานที่ท่องเที่ยวในแต่ละตำบลของบางกะเจ้า"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {districts.map((district) => (
                <Card
                  key={district._id}
                  isPressable
                  isHoverable
                  as={Link}
                  href={`/place/district/${district.slug.current}`}
                  className="border-none shadow-md"
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <FaBuilding className="text-emerald-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{district.title}</h3>
                        {district.description && (
                          <p className="text-default-500 text-sm line-clamp-1">
                            {district.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
          
          <Divider className="my-12" />
          
          {/* แสดงสถานที่ล่าสุด */}
          <section className="mb-8">
            <SectionHeading
              title="สถานที่ท่องเที่ยวล่าสุด"
              subtitle="มาใหม่"
              icon={<FaMapMarkedAlt className="text-primary-color" />}
              description="สถานที่ท่องเที่ยวที่เพิ่มเข้ามาล่าสุดในบางกะเจ้า"
            />
            
            <PlaceCardList />
          </section>
        </div>
      </div>
    </>
  );
}