"use client"

import React, { useState } from "react"

import { Form, Input, Button, Link } from "@heroui/react";

import { signIn, useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";

export default function page() {

  const { data: session } = useSession()
    if (session) {
      redirect('/welcome')
  }

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (!res) {
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
        return
      }
  
      if (res.error) {
        setError("ข้อมูลเข้าสู่ระบบไม่ถูกต้อง")
        return
      }
  
      router.replace("welcome")

    } catch (error) {
      console.error("Error during sign-in:", error)
    }
  }

  return (
    <div>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center">Login</h1>
        <Form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {error && (
            <p className='text-red-500'>{error}</p>
          )}

          <Input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            isRequired label="อีเมล" labelPlacement="outside"
            errorMessage="กรุณากรอกอีเมลที่ถูกต้อง"
            name="email"
            placeholder="กรอกอีเมลของคุณ"
            type="email"
          />

          <Input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            isRequired label="รหัสผ่าน" labelPlacement="outside"
            errorMessage="กรุณากรอกรหัสผ่าน"
            name="password"
            placeholder="กรอกรหัสผ่านของคุณ"
            type="password"
          />

          <Button type="submit" variant="bordered">
            Submit
          </Button>
        </Form>
        <p>Already have a account? go to <Link href="/register">Register</Link></p>
      </div>
    </div>
  )
}
