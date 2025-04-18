// src/components/home/BlogPreview.tsx
"use client";

import React from "react";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BlogCardList } from "@/components";

export default function BlogPreview() {
  return (
    <section className="py-16 bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">บทความล่าสุด</h2>
          <p className="text-default-500 max-w-2xl mx-auto">
            ติดตามข่าวสาร บทความ และเรื่องราวน่าสนใจเกี่ยวกับบางกระเจ้า
          </p>
        </motion.div>
        
        <div className="mb-12">
          <BlogCardList />
        </div>
        
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Button
            as={Link}
            href="/blog"
            color="primary"
            size="lg"
            className="font-semibold"
          >
            ดูบทความทั้งหมด
          </Button>
        </motion.div>
      </div>
    </section>
  );
};