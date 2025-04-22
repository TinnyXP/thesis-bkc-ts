// src/components/home/FeatureSection.tsx
"use client";

import React from "react";
import { Card, CardBody } from "@heroui/react";
import { motion } from "framer-motion";
import { FaLeaf, FaMapMarkedAlt, FaHistory, FaBiking } from "react-icons/fa";
// import { useTranslation } from "react-i18next";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
    >
      <Card className="border-none h-full shadow-md bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
        <CardBody className="py-6">
          <div className="text-primary-color mb-4 text-4xl">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-default-500 text-sm">{description}</p>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default function FeatureSection() {
  const features = [
    {
      icon: <FaLeaf />,
      title: "ปอดของกรุงเทพฯ",
      description: "พื้นที่สีเขียวขนาดใหญ่ที่ช่วยฟอกอากาศให้เมืองหลวง เป็นแหล่งอนุรักษ์พันธุ์พืชและสัตว์นานาชนิด",
      delay: 0.1
    },
    {
      icon: <FaMapMarkedAlt />,
      title: "6 ตำบลที่น่าค้นหา",
      description: "บางกระเจ้า บางน้ำผึ้ง บางกอบัว บางกระสอบ ทรงคนอง และบางยอ แต่ละพื้นที่มีเอกลักษณ์เฉพาะตัว",
      delay: 0.2
    },
    {
      icon: <FaHistory />,
      title: "ประวัติศาสตร์อันยาวนาน",
      description: "มีประวัติความเป็นมายาวนาน เป็นพื้นที่อันอุดมสมบูรณ์ มีวัฒนธรรมท้องถิ่นที่สืบทอดกันมาหลายชั่วอายุคน",
      delay: 0.3
    },
    {
      icon: <FaBiking />,
      title: "กิจกรรมกลางแจ้ง",
      description: "เหมาะสำหรับการปั่นจักรยานชมธรรมชาติ เยี่ยมชมตลาดน้ำ และทำกิจกรรมอื่นๆ ท่ามกลางธรรมชาติ",
      delay: 0.4
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-black">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">ค้นพบบางกระเจ้า</h2>
          <p className="text-default-500 max-w-2xl mx-auto">
            บางกระเจ้าเป็นพื้นที่สีเขียวที่ใหญ่ที่สุดใกล้กรุงเทพมหานคร ดั่งปอดของเมืองหลวงที่มอบอากาศบริสุทธิ์และธรรมชาติอันงดงาม
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Feature 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};