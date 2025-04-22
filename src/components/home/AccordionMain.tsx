"use client"

import { Accordion, AccordionItem, Link } from "@heroui/react";
import { FaQuestionCircle } from "react-icons/fa";

import React from 'react'
import { FiChevronLeft } from "react-icons/fi";

export default function AccordionMain() {

  const accordionContent = [
    {
      key: "faq1",
      ariaLabel: "Common Question 1",
      title: "What is the purpose of this platform?",
      content: "This platform is designed to help users manage and organize their projects efficiently, providing tools like file storage, collaboration, and analytics."
    },
    {
      key: "faq2",
      ariaLabel: "Common Question 2",
      title: "How do I reset my password?",
      content: "To reset your password, click on the 'Forgot Password' link on the login page, and follow the instructions sent to your registered email address."
    },
    {
      key: "faq3",
      ariaLabel: "Common Question 3",
      title: "Can I share files with others?",
      content: "Yes, you can share files by clicking the 'Share' button next to the file and entering the recipient's email address."
    }
  ];

  return (
    <section
      className="py-10 bg-zinc-50 dark:bg-zinc-950"
    >
      <div className="container max-w-5xl mx-auto px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between px-2 mb-5">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <FaQuestionCircle size={35} className="text-primary-color" />
            <p className="text-3xl md:text-4xl font-bold">คำถามที่พบบ่อย</p>
          </div>
          <div className="text-md w-full md:w-auto text-left md:text-right">
            <p className="text-default-500">ไม่พบคำตอบสำหรับคำถามของคุณ?</p>
            <div className="flex justify-start md:justify-end items-center gap-2">
              <p className="text-default-500">อย่าลังเลที่จะ</p>
              <Link className="text-primary-color" underline="hover" href="#">ติดต่อเรา</Link>
            </div>
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