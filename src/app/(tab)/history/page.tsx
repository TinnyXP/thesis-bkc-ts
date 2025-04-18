'use client'

import React from "react";
import { Footer, NavBar } from "@/components"
import { Tabs, Tab, Card, CardBody, Image } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FaLeaf, FaTree, FaMapMarkerAlt, FaHistory, FaBookOpen } from "react-icons/fa";

export default function Page() {
  const [selected, setSelected] = React.useState("bangkachao");
  const { t } = useTranslation();

  const districtData = {
    bangkachao: {
      title: t('bkcTitle'),
      content: t('bkcHis'),
      icon: <FaLeaf />
    },
    songkanong: {
      title: t('sknTitle'),
      content: t('sknHis'),
      icon: <FaTree />
    },
    bangkasop: {
      title: t('bksTitle'),
      content: t('bksHis'),
      icon: <FaMapMarkerAlt />
    },
    bangnamphueng: {
      title: t('bnpTitle'),
      content: t('bnpHis'),
      icon: <FaLeaf />
    },
    bangkobua: {
      title: t('bkbTitle'),
      content: t('bkbHis'),
      icon: <FaTree />
    },
    bangyor: {
      title: t('byTitle'),
      content: t('byHis'),
      icon: <FaMapMarkerAlt />
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
    <div className="font-[family-name:var(--font-line-seed-sans)] min-h-screen">
      <NavBar />

      <motion.div
        className="max-w-5xl mx-auto p-6 text-gray-800"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div
          className="relative rounded-xl overflow-hidden mb-8 h-64 md:h-96"
          variants={fadeIn}
        >
          <Image
            src="/api/placeholder/1200/600"
            alt={t('history')}
            className="w-full h-full object-cover"
            removeWrapper
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-white text-center drop-shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {t('history')}
            </motion.h1>
          </div>
        </motion.div>

        <motion.div
          className="mb-8 leading-7 space-y-4 bg-white p-6 rounded-xl shadow-md"
          variants={fadeIn}
        >
          <div className="flex items-start gap-4">
            <div className="hidden md:block">
              <FaHistory className="text-green-600 text-4xl mt-1" />
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

        <motion.h2
          className="text-2xl font-semibold mt-12 mb-6 flex items-center gap-2 text-green-800"
          variants={fadeIn}
        >
          <FaBookOpen />
          {t('hisTitle')}
        </motion.h2>

        <motion.div variants={fadeIn}>
          <Tabs
            aria-label="ตำบลในบางกะเจ้า"
            selectedKey={selected}
            onSelectionChange={(key) => setSelected(String(key))}
            color="success"
            variant="underlined"
            classNames={{
              tab: "data-[selected=true]:text-green-700 data-[selected=true]:font-semibold",
              tabList: "gap-4 w-full relative rounded-lg p-2 border-b border-green-200",
              cursor: "bg-green-500"
            }}
          >
            {Object.entries(districtData).map(([key, { title, content, icon }]) => (
              <Tab
                key={key}
                title={
                  <div className="flex items-center gap-2">
                    {icon}
                    <span>{title}</span>
                  </div>
                }
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-green-100 shadow-md bg-white/80 backdrop-blur-sm">
                    <CardBody className="leading-7 whitespace-pre-line p-6">
                      {content}
                    </CardBody>
                  </Card>
                </motion.div>
              </Tab>
            ))}
          </Tabs>
        </motion.div>

        <motion.div
          className="mt-12 p-6 bg-green-50 rounded-xl shadow-inner"
          variants={fadeIn}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
            <FaMapMarkerAlt />
            {t('exploreMore')}
          </h3>
          <p className="text-gray-700">
            {t('exploreDescription')}
          </p>
        </motion.div>
      </motion.div>

      <Footer />
    </div>
  )
}