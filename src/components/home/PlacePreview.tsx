// src/components/home/PlacePreview.tsx
"use client";

import React from "react";
import { Button, Link } from "@heroui/react";
import { motion } from "framer-motion";

import { PlaceCardList } from "@/components";

export default function PlacePreview() {
  return (
    <section className="py-16 bg-white dark:bg-black">
      <div className="container max-w-5xl mx-auto px-4 py-12 sm:px-6">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">สถานที่ท่องเที่ยวน่าสนใจ</h2>
          <p className="text-default-500 max-w-2xl mx-auto">
            ค้นพบสถานที่ท่องเที่ยวที่น่าสนใจในบางกะเจ้า ปอดสีเขียวแห่งกรุงเทพฯ
          </p>
        </motion.div>
        
        <div className="mb-12">
          <PlaceCardList showSearchBar={false} />
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
            href="/place"
            color="primary"
            size="lg"
            className="font-semibold"
          >
            ดูสถานที่ท่องเที่ยวทั้งหมด
          </Button>
        </motion.div>
      </div>
    </section>
  );
}