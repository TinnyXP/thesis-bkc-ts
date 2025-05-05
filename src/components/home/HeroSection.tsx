// src/components/home/HeroSection.tsx

"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Link from "next/link";

export default function HeroSection() {
  // เพิ่ม comment นี้เพื่อบอก ESLint ให้ข้าม warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* ภาพพื้นหลัง */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src="https://oyfe6pa52xt3zzj2.public.blob.vercel-storage.com/pathway-middle-green-leafed-trees-with-sun-shining-through-branches-dvwkHXLhMz1Dhs3WH6TxyiMEnaF2eE.jpg" 
          alt="บางกะเจ้า" 
          fill
          style={{ objectFit: 'cover' }}
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
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
            บางกะเจ้า
            <span className="block text-primary-color mt-2">ปอดสีเขียวแห่งกรุงเทพฯ</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl mb-8 text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            พื้นที่สีเขียวกลางเมืองที่อุดมสมบูรณ์ กับธรรมชาติและวิถีชีวิตชุมชนที่ท่านไม่ควรพลาด
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
              size="lg"
              className="font-semibold"
            >
              ประวัติความเป็นมา
            </Button>
            
            <Button
              as={Link}
              href="/blog"
              color="default"
              variant="bordered"
              size="lg"
              className="bg-white/10 backdrop-blur-sm font-semibold border-white text-white"
            >
              บทความน่าสนใจ
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};