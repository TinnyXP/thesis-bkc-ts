"use client";

import React from "react"
import Image from "next/image";

import { Button, Input, Link, Divider, ResizablePanel, Checkbox } from "@heroui/react";
import { AnimatePresence, m, domAnimation, LazyMotion } from "framer-motion";

import { FaEnvelope, FaArrowLeft } from "react-icons/fa6";

import { BsLine } from "react-icons/bs";

export default function page() {
  return (
    <div>
      <div className="flex justify-center items-center h-screen mx-5">
        <SignupForm />
      </div>
    </div>
  )
}

const SignupForm = () => {
  const [isFormVisible, setIsFormVisible] = React.useState(false);

  const variants = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 10 },
  };

  const orDivider = (
    <div className="flex items-center gap-4 py-2">
      <Divider className="flex-1" />
      <p className="shrink-0 text-sm text-default-400">หรือ</p>
      <Divider className="flex-1" />
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full items-center justify-center ">
      <Link href="/">
        <Image
          width={0}
          height={0}
          src={"/Bkj_logo.svg"}
          className="w-[200px] h-[80px] mb-5"
          alt="Website Logo"
        />
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-6 pt-6 shadow-small border-2 border-white dark:bg-zinc-950 dark:border-zinc-900">
        <ResizablePanel>
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-1">สมัครสมาชิก</h1>
            <a className="text-sm text-gray-400">โปรดสมัครสมาชิกเพื่อใช้งานบัญชีของคุณ</a>
          </div>
          <AnimatePresence initial={false} mode="popLayout">
            <LazyMotion features={domAnimation}>
              {isFormVisible ? (
                <m.form
                  animate="visible"
                  className="flex flex-col gap-y-3"
                  exit="hidden"
                  initial="hidden"
                  variants={variants}
                  onSubmit={(e) => e.preventDefault()}
                >
                  <Input
                    isRequired
                    label="ชื่อผู้ใช้"
                    name="username"
                    type="text"
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    isRequired
                    label="ที่อยู่อีเมล"
                    name="email"
                    type="email"
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    isRequired
                    label="รหัสผ่าน"
                    name="password"
                    type="password"
                    variant="bordered"
                    size="sm"
                  />
                  <Checkbox isRequired className="py-4" size="sm">
                    I agree with the&nbsp;
                    <Link href="#" size="sm">
                      Terms
                    </Link>
                    &nbsp; and&nbsp;
                    <Link href="#" size="sm">
                      Privacy Policy
                    </Link>
                  </Checkbox>
                  <Button color="primary" type="submit" className="font-bold">
                    สมัครสมาชิก
                  </Button>
                  {orDivider}
                  <Button fullWidth variant="flat" className="font-bold" onPress={() => setIsFormVisible(false)}
                    startContent={<FaArrowLeft size={16} />}
                  >
                    สมัครสมาชิกผ่านรูปแบบอื่น
                  </Button>
                </m.form>
              ) : (
                <>
                  <Button className="font-bold dark:text-black" fullWidth color="primary" type="button" onPress={() => setIsFormVisible(true)}
                    startContent={<FaEnvelope size={19} />}
                  >
                    สมัครสมาชิกผ่าน Email
                  </Button>
                  {orDivider}
                  <m.div
                    animate="visible"
                    className="flex flex-col gap-y-2"
                    exit="hidden"
                    initial="hidden"
                    variants={variants}
                  >
                    <div className="flex flex-col gap-2">
                      <Button fullWidth startContent={<BsLine size={19} />} variant="flat">
                        เชื่อมต่อผ่าน Line
                      </Button>
                    </div>
                    <p className="mt-3 text-center text-small font-normal text-gray-400">
                      หากสมัครสมาชิกสำเร็จแล้ว&nbsp;
                      <Link href="/login" size="sm" className="font-bold">
                        เข้าสู่ระบบที่นี่
                      </Link>
                    </p>
                  </m.div>
                </>
              )}
            </LazyMotion>
          </AnimatePresence>
        </ResizablePanel>
      </div>
    </div>
  );
}