"use client"

import { Accordion, AccordionItem, } from "@heroui/react";
import { FaQuestionCircle } from "react-icons/fa";

import React from 'react'
import { FiChevronLeft } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function AccordionMain() {
  const {t} = useTranslation();

  const accordionContent = [
    {
      key: "faq1",
      ariaLabel: "Common Question 1",
      title: t('questionTitle1'),
      content: t('questionAnswer1')
    },
    {
      key: "faq2",
      ariaLabel: "Common Question 2",
      title: t('questionTitle2'),
      content: t('questionAnswer2')
    },
    {
      key: "faq3",
      ariaLabel: "Common Question 3",
      title: t('questionTitle3'),
      content: t('questionAnswer3')
    }
  ];

  return (
    <section
      className="py-10 bg-zinc-50 dark:bg-zinc-950"
    >
      <div className="container max-w-7xl mx-auto px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between px-2 mb-5">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <FaQuestionCircle size={35} className="text-primary-color" />
            <p className="text-3xl md:text-4xl font-bold">{t('questionBig')}</p>
          </div>
          
        </div>
        <Accordion
          dividerProps={{
            className: "bg-gradient-to-r from-transparent via-default-400/50 to-transparent h-[1px]",
          }}
          itemClasses={{
            title: "text-md md:text-lg font-bold",
          }}
        >
          {accordionContent.map(({ key, ariaLabel, title, content }) => (
            <AccordionItem key={key} aria-label={ariaLabel} title={title}
              indicator={<FiChevronLeft size={20} className="text-primary-color" />}
            >
              {content}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}