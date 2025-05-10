// src/components/home/HeroSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { FaHistory, FaNewspaper } from "react-icons/fa";

export default function HeroSection() {
  const { t } = useTranslation();
  // เพิ่ม state สำหรับตรวจสอบการ mount component
  const [isMounted, setIsMounted] = useState(false);
  
  // useEffect เพื่อตั้งค่า isMounted เป็น true เมื่อ component ถูก mount บน client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* ภาพพื้นหลัง */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src="https://oyfe6pa52xt3zzj2.public.blob.vercel-storage.com/pathway-middle-green-leafed-trees-with-sun-shining-through-branches-hfT2uIv9B10jgjaeoUuuHJZwhd7Blf.jpg" 
          alt="บางกะเจ้า" 
          fill
          style={{ objectFit: 'cover' }}
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          className="max-w-3xl text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* แก้ตรงนี้ ใช้ค่าเริ่มต้นเป็นภาษาไทยก่อนแล้วค่อยใช้ i18n เมื่อ component ถูก mount แล้ว */}
            {isMounted ? t('bigTittle1') : "บางกะเจ้า"}
            <span className="block text-primary-color mt-2">
              {isMounted ? t('bigTittle2') : "ปอดสีเขียวแห่งกรุงเทพฯ"}
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl mb-8 text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {isMounted ? t('bigTittlePara') : "พื้นที่สีเขียวกลางเมืองที่อุดมสมบูรณ์ กับธรรมชาติและวิถีชีวิตชุมชนที่ท่านไม่ควรพลาด"}
          </motion.p>
          
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              as={Link}
              href="/history"
              color="primary"
              variant="shadow"
              className="font-semibold"
              startContent={<FaHistory />}
            >
              {isMounted ? t('bigTittleButtonF') : "ประวัติ"}
            </Button>
            
            <Button
              as={Link}
              href="/blog"
              color="default"
              variant="bordered"
              className="bg-white/10 backdrop-blur-sm font-semibold border-zinc-500/50 text-white"
              startContent={<FaNewspaper />}
            >
              {isMounted ? t('bigTittleButton') : "บทความน่าสนใจ"}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};