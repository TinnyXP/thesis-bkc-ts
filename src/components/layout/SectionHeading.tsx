// src/components/layout/SectionHeading.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  description?: string;
  centered?: boolean;
  icon?: React.ReactNode;
}

export default function SectionHeading({
  title,
  subtitle,
  description,
  centered = false,
  icon
}: SectionHeadingProps) {
  return (
    <motion.div
      className={`mb-8 ${centered ? "text-center" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      {subtitle && (
        <p className="text-primary-color font-medium mb-2">
          {subtitle}
        </p>
      )}
      
      <h2 className={`text-2xl md:text-3xl font-bold ${icon ? "flex items-center gap-2" : ""}`}>
        {icon}
        <span>{title}</span>
      </h2>
      
      {description && (
        <p className="text-default-500 max-w-prose">
          {description}
        </p>
      )}
    </motion.div>
  );
}