// src/app/place/[type]/[slug]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import { ImageModal, SlugBreadcrumb, SlugShareButton, ReviewSection } from "@/components";
import { getPlaceBySlug } from "@/lib/sanity/placeQueries";
import { urlFor } from "@/lib/sanity/image";
import { createPlaceMetadata } from "@/lib/sanity/placeMetadata";
import { Chip, Card, CardBody, Link } from "@heroui/react";
import { PortableText } from "next-sanity";
import { Metadata } from "next";
import { headers } from 'next/headers';
import { PortableTextReactComponents } from "@portabletext/react";
import { FaQuoteLeft, FaMapMarkerAlt, FaClock, FaPhone, FaGlobe, FaFacebook, FaLine, FaCalendarAlt, FaTag, FaDollarSign } from "react-icons/fa";
import Script from "next/script";

// กำหนด metadata แบบ dynamic จากข้อมูลสถานที่ท่องเที่ยว
export async function generateMetadata(
  { params }: { params: { type: string; slug: string } }
): Promise<Metadata> {
  // ดึงข้อมูลสถานที่ท่องเที่ยว
  const place = await getPlaceBySlug(params.slug);

  if (!place) {
    return {
      title: "ไม่พบสถานที่ท่องเที่ยว",
      description: "ไม่พบสถานที่ท่องเที่ยวที่คุณกำลังมองหา",
    };
  }

  // สร้าง URL สำหรับ Open Graph
  const headersList = headers();
  const domain = headersList.get('host') || '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${domain}`;

  // สร้าง metadata สำหรับสถานที่ท่องเที่ยว
  const placeMetadata = createPlaceMetadata(place, baseUrl);

  // ถ้า placeMetadata เป็น null ให้กำหนดค่าเริ่มต้น
  if (!placeMetadata) {
    return {
      title: "ไม่พบสถานที่ท่องเที่ยว",
      description: "ไม่พบสถานที่ท่องเที่ยวที่คุณกำลังมองหา",
    };
  }

  return {
    title: placeMetadata.title,
    description: placeMetadata.description,
    openGraph: {
      title: placeMetadata.title,
      description: placeMetadata.description,
      url: placeMetadata.url,
      images: placeMetadata.imageUrl ? [{ url: placeMetadata.imageUrl }] : undefined,
      type: 'article',
      publishedTime: place.publishedAt,
    },
    alternates: {
      canonical: placeMetadata.url,
    },
    twitter: {
      card: 'summary_large_image',
      title: placeMetadata.title,
      description: placeMetadata.description,
      images: placeMetadata.imageUrl ? [placeMetadata.imageUrl] : [],
    }
  };
}

const portableTextComponents: Partial<PortableTextReactComponents> = {
  block: {
    h1: ({ children }) => <h1 className="text-3xl font-bold mb-3">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold mb-3">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-bold mb-3">{children}</h4>,
    normal: ({ children }) => <p className="text-base leading-relaxed">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="relative pl-6 pr-2 my-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-color rounded-l-lg"></div>
        <div className="relative">
          <FaQuoteLeft className="absolute -top-2 -left-4 h-4 w-4 text-primary-color" fill="currentColor" />
          <div className="text-lg text-zinc-700 dark:text-zinc-300 italic">
            {children}
          </div>
        </div>
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => {
      const href = value?.href || "#";
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {children}
        </a>
      );
    },
  } as PortableTextReactComponents["marks"],
  types: {
    image: ({ value }) => {
      const imageUrl = urlFor(value)?.width(1366).auto("format").url();
      const originalUrl = value?.asset?._ref ? urlFor(value)?.url() ?? null : null;
      return imageUrl ? (
        <ImageModal
          src={imageUrl}
          originalSrc={originalUrl as string}
          alt="รูปภาพสถานที่ท่องเที่ยว"
          className="rounded-lg shadow-lg w-full my-2"
        />
      ) : null;
    },
  },
};

// Component แสดงข้อความเมื่อไม่พบสถานที่ท่องเที่ยว
const PlaceNotFound = () => (
  <div className="min-h-screen">
    <div className="container mx-auto max-w-5xl flex-grow px-4 my-10 flex flex-col items-center justify-center gap-6 min-h-[50vh] font-[family-name:var(--font-bai-jamjuree)]">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">ไม่พบสถานที่ท่องเที่ยว</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          ขออภัย ไม่พบสถานที่ท่องเที่ยวที่คุณกำลังมองหา
        </p>
        <Link href="/place" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
          กลับไปยังหน้ารวมสถานที่ท่องเที่ยว
        </Link>
      </div>
    </div>
  </div>
);

export default async function PlacePage({
  params
}: {
  params: { type: string; slug: string }
}) {
  // ตรวจสอบว่ามีพารามิเตอร์ slug หรือไม่
  if (!params.slug) {
    notFound();
  }

  try {
    // ดึงข้อมูลสถานที่ท่องเที่ยวจาก Sanity
    const place = await getPlaceBySlug(params.slug, {
      next: { revalidate: 60 }
    });

    // ถ้าไม่พบสถานที่ท่องเที่ยว
    if (!place) {
      return <PlaceNotFound />;
    }

    // เตรียมข้อมูลสำหรับแสดงผล
    const headersList = headers();
    const domain = headersList.get('host') || '';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${domain}`;
    const placeTypeSlug = place.placeType?.slug.current || 'uncategorized';
    const fullUrl = `${baseUrl}/place/${placeTypeSlug}/${place.slug.current}`;

    const mainImageUrl = place.mainImage?.asset?.url
      ? `${place.mainImage.asset.url}?w=1600&auto=format`
      : null;
    const originalMainImageUrl = place.mainImage?.asset?.url || null;

    // สร้าง metadata สำหรับสถานที่ท่องเที่ยว (มี JSON-LD)
    const placeMetadata = createPlaceMetadata(place, baseUrl);

    // แปลงข้อมูลวันทำการให้อยู่ในรูปแบบที่เข้าใจง่าย
    const translateDay = (day: string): string => {
      const days: Record<string, string> = {
        'monday': 'วันจันทร์',
        'tuesday': 'วันอังคาร',
        'wednesday': 'วันพุธ',
        'thursday': 'วันพฤหัสบดี',
        'friday': 'วันศุกร์',
        'saturday': 'วันเสาร์',
        'sunday': 'วันอาทิตย์',
        'holiday': 'วันหยุดนักขัตฤกษ์'
      };
      return days[day] || day;
    };

    return (
      <div className="min-h-screen">

        {/* เพิ่ม JSON-LD schema สำหรับ SEO */}
        {placeMetadata?.jsonLd && (
          <Script
            id={`place-jsonld-${place._id}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: placeMetadata.jsonLd }}
          />
        )}

        <section className="container mx-auto max-w-5xl flex-grow px-4 my-5 flex flex-col gap-5 font-[family-name:var(--font-bai-jamjuree)]">
          {/* Breadcrumb */}
          <SlugBreadcrumb
            postTitle={place.title}
            postSlug={place.slug.current}
            category={{
              title: place.placeType?.title || 'ไม่ระบุประเภท',
              slug: place.placeType?.slug.current || 'uncategorized'
            }}
            basePath="place"
          />

          {/* รูปภาพหลัก */}
          <div className="prose prose-2xl dark:prose-invert prose-zinc">
            {mainImageUrl ? (
              <ImageModal
                src={mainImageUrl}
                originalSrc={originalMainImageUrl}
                alt={place.title}
                className="rounded-lg shadow-lg w-full my-1"
              />
            ) : (
              <div className="aspect-video bg-zinc-200 rounded-lg shadow-lg flex items-center justify-center">
                <p className="text-zinc-500">ไม่มีรูปภาพ</p>
              </div>
            )}
          </div>

          {/* หัวข้อสถานที่ท่องเที่ยว */}
          <div className="text-center prose prose-2xl dark:prose-invert prose-zinc">
            <h1 className="text-3xl md:text-4xl font-bold">{place.title}</h1>
          </div>

          {/* ข้อมูลเกี่ยวกับสถานที่และปุ่มแชร์ */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                {place.district && (
                  <p className="text-base flex items-center gap-1">
                    <FaMapMarkerAlt className="text-primary-color" />
                    <span>
                      ตำบล: <span className="font-medium">{place.district.title}</span>
                    </span>
                  </p>
                )}
                {place.placeType && (
                  <p className="text-base flex items-center gap-1">
                    <FaTag className="text-primary-color" />
                    <span>
                      ประเภท: <span className="font-medium">{place.placeType.title}</span>
                    </span>
                  </p>
                )}
              </div>
            </div>
            {/* ปุ่มแชร์ */}
            <SlugShareButton
              url={fullUrl}
              title={place.title}
              contentItem={place}
              contentType="place"
            />
          </div>

          <div className="w-full border-1 border-primary my-4" />

          {/* เนื้อหาหลัก */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* เนื้อหาสถานที่ท่องเที่ยว - 2/3 ของหน้าจอ */}
            <div className="md:col-span-2">
              <article className="mt-2 mb-10 prose prose-2xl dark:prose-invert prose-zinc">
                {place.description && (
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg mb-6">
                    <p className="text-lg italic">{place.description}</p>
                  </div>
                )}

                {Array.isArray(place.body) ? (
                  <PortableText value={place.body} components={portableTextComponents} />
                ) : (
                  <p className="text-zinc-500">ไม่มีเนื้อหา</p>
                )}
              </article>

              {/* แกลเลอรี่รูปภาพ */}
              {place.gallery && place.gallery.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4">แกลเลอรี่รูปภาพ</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {place.gallery.map((image, index) => (
                      image.asset?.url ? (
                        <ImageModal
                          key={index}
                          src={`${image.asset.url}?w=400&h=400&fit=crop&auto=format`}
                          originalSrc={image.asset.url}
                          alt={`${place.title} - รูปที่ ${index + 1}`}
                          className="rounded-lg shadow-md w-full h-48 object-cover"
                        />
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {/* กิจกรรมที่น่าสนใจ */}
              {place.activities && place.activities.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4">กิจกรรมที่น่าสนใจ</h2>
                  <ul className="list-disc pl-5 space-y-2">
                    {place.activities.map((activity, index) => (
                      <li key={index} className="text-lg">{activity}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* แท็ก */}
              {place.tags && place.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-10">
                  {place.tags.map((tag, index) => (
                    <Chip key={index} color="primary" variant="flat">
                      #{tag}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {/* ข้อมูลเพิ่มเติม - 1/3 ของหน้าจอ */}
            <div className="space-y-6">
              {/* ข้อมูลการติดต่อ */}
              {place.contactInfo && (
                <Card className="shadow-sm">
                  <CardBody>
                    <h3 className="text-xl font-bold mb-4">ข้อมูลการติดต่อ</h3>
                    <div className="space-y-3">
                      {place.contactInfo.phone && (
                        <p className="flex items-center gap-2">
                          <FaPhone className="text-primary-color" />
                          <a href={`tel:${place.contactInfo.phone}`} className="hover:underline">
                            {place.contactInfo.phone}
                          </a>
                        </p>
                      )}
                      {place.contactInfo.email && (
                        <p className="flex items-center gap-2">
                          <span className="text-primary-color">✉</span>
                          <a href={`mailto:${place.contactInfo.email}`} className="hover:underline">
                            {place.contactInfo.email}
                          </a>
                        </p>
                      )}
                      {place.contactInfo.website && (
                        <p className="flex items-center gap-2">
                          <FaGlobe className="text-primary-color" />
                          <a href={place.contactInfo.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            เว็บไซต์
                          </a>
                        </p>
                      )}
                      {place.contactInfo.facebook && (
                        <p className="flex items-center gap-2">
                          <FaFacebook className="text-blue-600" />
                          <a href={place.contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Facebook
                          </a>
                        </p>
                      )}
                      {place.contactInfo.line && (
                        <p className="flex items-center gap-2">
                          <FaLine className="text-green-500" />
                          <span>Line: {place.contactInfo.line}</span>
                        </p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* ที่อยู่ */}
              {place.address && (
                <Card className="shadow-sm">
                  <CardBody>
                    <h3 className="text-xl font-bold mb-4">ที่อยู่</h3>
                    <p className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-primary-color mt-1" />
                      <span>{place.address}</span>
                    </p>
                  </CardBody>
                </Card>
              )}

              {/* เวลาทำการ */}
              {place.operatingHours && place.operatingHours.length > 0 && (
                <Card className="shadow-sm">
                  <CardBody>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FaClock className="text-primary-color" />
                      <span>เวลาทำการ</span>
                    </h3>
                    <ul className="space-y-2">
                      {place.operatingHours.map((hour, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{translateDay(hour.day)}</span>
                          <span className={hour.isClosed ? "text-red-500 font-medium" : ""}>
                            {hour.isClosed ? "ปิดทำการ" : `${hour.open} - ${hour.close} น.`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              )}

              {/* ราคาค่าเข้าชม */}
              {place.pricing && place.pricing.length > 0 && (
                <Card className="shadow-sm">
                  <CardBody>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FaDollarSign className="text-primary-color" />
                      <span>ค่าเข้าชม</span>
                    </h3>
                    <ul className="space-y-2">
                      {place.pricing.map((price, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{price.type}</span>
                          <span className="font-medium">{price.price} บาท</span>
                        </li>
                      ))}
                    </ul>
                    {place.pricing.some(p => p.description) && (
                      <div className="mt-4 pt-2 border-t text-sm text-zinc-600">
                        {place.pricing.map((price, index) => (
                          price.description ? (
                            <p key={index} className="mb-1">
                              <span className="font-medium">{price.type}:</span> {price.description}
                            </p>
                          ) : null
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* ช่วงเวลาที่เหมาะแก่การเยี่ยมชม */}
              {place.bestTimeToVisit && (
                <Card className="shadow-sm">
                  <CardBody>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-primary-color" />
                      <span>ช่วงเวลาที่เหมาะแก่การเยี่ยมชม</span>
                    </h3>
                    <p>{place.bestTimeToVisit}</p>
                  </CardBody>
                </Card>
              )}

              {/* สิ่งอำนวยความสะดวก */}
              {place.facilities && place.facilities.length > 0 && (
                <Card className="shadow-sm">
                  <CardBody>
                    <h3 className="text-xl font-bold mb-4">สิ่งอำนวยความสะดวก</h3>
                    <div className="flex flex-wrap gap-2">
                      {place.facilities.map((facility, index) => {
                        // แปลงชื่อสิ่งอำนวยความสะดวกเป็นภาษาไทย
                        const facilityText: Record<string, string> = {
                          'parking': 'ที่จอดรถ',
                          'restroom': 'ห้องน้ำ',
                          'restaurant': 'ร้านอาหาร',
                          'wifi': 'WiFi',
                          'photospots': 'จุดถ่ายรูป',
                          'souvenirshop': 'ร้านขายของที่ระลึก',
                          'wheelchair': 'ทางลาด/ทางสำหรับรถเข็น',
                          'airconditioner': 'เครื่องปรับอากาศ'
                        };

                        return (
                          <Chip key={index} color="success" variant="flat">
                            {facilityText[facility] || facility}
                          </Chip>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>

          {/* ส่วนรีวิว */}
          <section className="container mx-auto max-w-5xl flex-grow px-4 my-10 flex flex-col gap-5 font-[family-name:var(--font-bai-jamjuree)]">
            <ReviewSection placeId={place.slug.current} />
          </section>
          
        </section>

      </div>
    );
  } catch (error) {
    console.error("Error fetching place:", error);
    return <PlaceNotFound />;
  }
}