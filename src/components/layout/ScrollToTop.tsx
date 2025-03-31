"use client";

import React, { useEffect, useState } from "react"
import { Button } from "@heroui/react"
import { FaAnglesUp } from "react-icons/fa6"
import { motion } from "framer-motion"

const MotionButton = motion.create(Button)

export default function ScrollToTop() {
  const [backToTopButton, setBackToTopButton] = useState(false)

  useEffect(() => {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        setBackToTopButton(true)
      } else {
        setBackToTopButton(false)
      }
    })
  }, [])

  const backToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <div>
      {backToTopButton && (
        <MotionButton
          key="backToTopButton"
          className="fixed bottom-3.5 right-4 text-white z-[500] drop-shadow-md transition-all duration-300 ease-in-out hover:drop-shadow-lg"
          isIconOnly
          radius="full"
          size="md"
          color="primary"
          variant="shadow"
          onPress={backToTop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaAnglesUp size={22} />
        </MotionButton>
      )}
    </div>
  )
}