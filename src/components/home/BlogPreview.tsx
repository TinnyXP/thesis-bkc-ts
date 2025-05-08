// src/components/home/BlogPreview.tsx
"use client";

import React from "react";
import { Button, Link } from "@heroui/react";
import { motion } from "framer-motion";
import { BlogCardList } from "@/components";
import { useTranslation } from "react-i18next";

export default function BlogPreview() {
const { t } = useTranslation();
  return (
    <section className="py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="container max-w-5xl mx-auto px-4 py-12 sm:px-6">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('section4')}</h2>
          <p className="text-default-500 max-w-2xl mx-auto">
          {t('sec4Para')}
          </p>
        </motion.div>
        
        <div className="mb-12">
          <BlogCardList showSearchBar={false} />
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
            {t('blogButton')}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};