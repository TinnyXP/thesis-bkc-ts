// src/components/home/CTASection.tsx
"use client";

import React from "react";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* ภาพพื้นหลัง */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src="/images/cta-bg.jpg" 
          alt="บางกระเจ้า" 
          fill
          style={{ objectFit: 'cover' }}
          quality={80}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/60" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            มาร่วมสัมผัสประสบการณ์ที่บางกระเจ้า
          </motion.h2>
          
          <motion.p 
            className="text-lg mb-8 text-white/90"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            แหล่งท่องเที่ยวเชิงนิเวศที่สมบูรณ์ใกล้กรุงเทพฯ เพียงข้ามฝั่งแม่น้ำเจ้าพระยา 
            สัมผัสวิถีชีวิตชุมชน และกิจกรรมสนุกสนานท่ามกลางธรรมชาติ
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button
              color="primary"
              size="lg"
              href="/place"
              className="font-semibold"
            >
              สถานที่ท่องเที่ยว
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};