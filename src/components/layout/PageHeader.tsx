// src/components/layout/PageHeader.tsx
"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  buttons?: {
    primary?: {
      text: string;
      href: string;
      icon?: React.ReactNode;
    };
    secondary?: {
      text: string;
      href: string;
      icon?: React.ReactNode;
    };
  };
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  description,
  imageSrc = "https://oyfe6pa52xt3zzj2.public.blob.vercel-storage.com/pathway-middle-green-leafed-trees-with-sun-shining-through-branches-hfT2uIv9B10jgjaeoUuuHJZwhd7Blf.jpg",
  imageAlt = "บางกะเจ้า",
  buttons,
  children
}: PageHeaderProps) {
  return (
    <section className="relative min-h-[40vh] md:min-h-[50vh] flex items-center overflow-hidden py-10">
      {/* ภาพพื้นหลัง */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          style={{ objectFit: 'cover' }}
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          className="max-w-3xl text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {subtitle && (
            <motion.span
              className="inline-block text-primary-color bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full text-sm md:text-base font-medium mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              {subtitle}
            </motion.span>
          )}

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {title}
          </motion.h1>

          {description && (
            <motion.p
              className="text-lg md:text-xl mb-8 text-white/90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {description}
            </motion.p>
          )}

          {(buttons || children) && (
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {buttons?.primary && (
                <Button
                  as="a"
                  href={buttons.primary.href}
                  color="primary"
                  size="lg"
                  className="font-semibold"
                  startContent={buttons.primary.icon}
                >
                  {buttons.primary.text}
                </Button>
              )}

              {buttons?.secondary && (
                <Button
                  as="a"
                  href={buttons.secondary.href}
                  color="default"
                  variant="bordered"
                  size="lg"
                  className="bg-white/10 backdrop-blur-sm font-semibold border-white text-white"
                  startContent={buttons.secondary.icon}
                >
                  {buttons.secondary.text}
                </Button>
              )}

              {children}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}