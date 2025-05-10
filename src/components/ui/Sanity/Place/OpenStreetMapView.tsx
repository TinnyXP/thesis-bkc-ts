// src/components/ui/Sanity/Place/OpenStreetMapView.tsx (ปรับปรุงให้มีหมุดที่ชัดเจน)
"use client";

import React from 'react';
import { Card, CardBody } from "@heroui/react";
import { FaMapMarkedAlt } from 'react-icons/fa';

interface OpenStreetMapViewProps {
  latitude: number;
  longitude: number;
  title: string;
  height?: string;
  zoom?: number;
  showDirectionsLink?: boolean;
}

export default function OpenStreetMapView({
  latitude,
  longitude,
  title,
  height = "400px",
  zoom = 16,
  showDirectionsLink = true
}: OpenStreetMapViewProps) {
  // สร้าง URL แบบใหม่เพื่อให้มีหมุดที่ชัดเจน
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.005}%2C${latitude-0.005}%2C${longitude+0.005}%2C${latitude+0.005}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  
  // ปรับปรุง URL สำหรับปุ่มนำทาง
  const viewMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;
  
  // URL สำหรับนำทางด้วย OSRM
  const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${latitude}%2C${longitude}`;

  return (
    <Card className="bg-white shadow-md dark:bg-zinc-950 border-2 border-zinc-150 dark:border-zinc-900 w-full h-[350px] overflow-hidden">
      <CardBody className="p-0">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <FaMapMarkedAlt className="text-primary-color" />
          <h3 className="text-xl font-bold">แผนที่</h3>
        </div>
        
        <div style={{ width: '100%', height }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={mapEmbedUrl}
            allowFullScreen
            title={`แผนที่ ${title}`}
            loading="lazy"
          ></iframe>
        </div>
        
        {showDirectionsLink && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <a
              href={viewMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-color hover:underline font-medium"
            >
              ดูในแผนที่เต็ม
            </a>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-color hover:underline font-medium"
            >
              นำทาง
            </a>
          </div>
        )}
      </CardBody>
    </Card>
  );
}