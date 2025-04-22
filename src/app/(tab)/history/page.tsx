// src/app/(tab)/history/page.tsx
'use client'

import React from "react";
import { PageHeader, SectionHeading } from "@/components";
import { Link, Button, Accordion, AccordionItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FaLeaf, FaTree, FaMapMarkerAlt, FaHistory, FaBookOpen, FaInfoCircle, FaSearch } from "react-icons/fa";

export default function HistoryPage() {
  const [selected, setSelected] = React.useState("bangkachao");
  const { t } = useTranslation();

  const districtData = {
    bangkachao: {
      title: t('bkcTitle'),
      content: t('bkcHis'),
      icon: <FaLeaf className="text-primary-color" />
    },
    songkanong: {
      title: t('sknTitle'),
      content: t('sknHis'),
      icon: <FaTree className="text-green-600" />
    },
    bangkasop: {
      title: t('bksTitle'),
      content: t('bksHis'),
      icon: <FaMapMarkerAlt className="text-blue-600" />
    },
    bangnamphueng: {
      title: t('bnpTitle'),
      content: t('bnpHis'),
      icon: <FaLeaf className="text-primary-color" />
    },
    bangkobua: {
      title: t('bkbTitle'),
      content: t('bkbHis'),
      icon: <FaTree className="text-green-600" />
    },
    bangyor: {
      title: t('byTitle'),
      content: t('byHis'),
      icon: <FaMapMarkerAlt className="text-blue-600" />
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  return (
    <>
      <PageHeader
        title={t('history')}
        subtitle="ประวัติศาสตร์"
        description="เรียนรู้ประวัติศาสตร์อันน่าสนใจของบางกระเจ้า พื้นที่สีเขียวสำคัญใกล้กรุงเทพฯ ที่มีเรื่องราวน่าสนใจนับร้อยปี"
        buttons={{
          primary: {
            text: "ตำบลในบางกระเจ้า",
            href: "#districts",
            icon: <FaMapMarkerAlt />
          },
          secondary: {
            text: "ค้นหาเพิ่มเติม",
            href: "#explore",
            icon: <FaSearch />
          }
        }}
      />

      <div className="container max-w-5xl mx-auto px-4 py-12">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeIn}>
            <SectionHeading
              title={t('history')}
              subtitle="ประวัติความเป็นมา"
              icon={<FaHistory className="text-primary-color" />}
            />
          </motion.div>

          <motion.div
            className="mb-12 leading-7 space-y-4 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 p-6 rounded-xl shadow-md"
            variants={fadeIn}
          >
            <div className="flex items-start gap-4">
              <div className="hidden md:flex">
                <span className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-color flex items-center justify-center">
                  <FaInfoCircle className="text-white text-2xl" />
                </span>
              </div>
              <div>
                <p className="text-lg">
                  {t('bkcMain')}
                </p>
                <p className="text-lg mt-4">
                  {t('bkcMain2')}
                </p>
              </div>
            </div>
          </motion.div>

          <div id="districts">
            <SectionHeading
              title={t('hisTitle')}
              subtitle="ประวัติตำบล"
              icon={<FaBookOpen className="text-primary-color" />}
            />
          </div>

          {/* Tabs ตำบลต่างๆ */}
          <motion.div
            variants={fadeIn}
          >
            <Accordion
              aria-label="ตำบลในบางกะเจ้า"
              onSelectionChange={(key) => setSelected(String(key))}
              variant="bordered"
            >
              {Object.entries(districtData).map(([key, { title, content, icon }]) => (
                <AccordionItem
                  key={key}
                  title={
                    <div className="flex items-center gap-2 whitespace-nowrap text-lg md:text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                      <span className={selected === key ? "text-primary-color" : "text-zinc-500 dark:text-zinc-400"}>
                        {icon}
                      </span>
                      <span>{title}</span>
                    </div>
                  }
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pb-4"
                  >
                    <div className="bg-white shadow-sm dark:bg-zinc-950 border-2 border-zinc-150 dark:border-zinc-900 rounded-lg overflow-hidden">
                      <div className="leading-7 whitespace-pre-line p-6 text-zinc-800 dark:text-zinc-200">
                        {content}
                      </div>
                    </div>
                  </motion.div>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            id="explore"
            className="mt-16 p-6 bg-gradient-to-r from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 rounded-xl shadow-md"
            variants={fadeIn}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="bg-primary-color rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
                <FaMapMarkerAlt className="text-white text-lg" />
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-semibold text-primary-color mb-2">
                  {t('exploreMore')}
                </h3>
                <p className="text-default-700 dark:text-default-300 mb-4">
                  {t('exploreDescription')}
                </p>
              </div>

              <Button
                as={Link}
                href="/place"
                color="primary"
                size="md"
                className="mt-2 md:mt-0"
              >
                สถานที่ท่องเที่ยว
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}