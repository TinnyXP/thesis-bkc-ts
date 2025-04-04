"use client"

import React, { useState } from 'react'

import { Form, Input, Button, Link } from "@heroui/react";

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function Page() {

  const { data: session } = useSession()
  if (session) {
    redirect('/welcome')
  }

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!name || !email || !password || !confirmPassword) {
      setError('Password do not match')
      return
    }

    try {

      const resCheckUser = await fetch('/api/auth/checkUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const { user } = await resCheckUser.json()

      if (user) {
        setError('User already exists')
        return
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      if (response.ok) {
        setSuccess('Registration successful')
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setIsSubmitted(false);
        setError('');
      }

    } catch (error) {
      console.log("Error during registrration", error)
    }
  }

  return (
    <div>
      <div className='container mx-auto'>
        <h1 className='text-3xl font-bold text-center'>Register</h1>
        <Form onSubmit={handleSubmit} className='flex flex-col gap-4'>

          {error && (
            <p className='text-red-500'>{error}</p>
          )}

          {success && (
            <p className='text-green-500'>{success}</p>
          )}

          <Input
            onChange={(e) => setName(e.target.value)}
            value={name}
            isRequired
            label="ชื่อผู้ใช้"
            labelPlacement="outside"
            errorMessage={isSubmitted && !name ? "กรุณากรอกชื่อผู้ใช้" : ""}
            name="username"
            placeholder="กรอกชื่อผู้ใช้ของคุณ"
            type="text"
          />

          <Input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            isRequired
            label="อีเมล"
            labelPlacement="outside"
            errorMessage={isSubmitted && !email ? "กรุณากรอกอีเมลที่ถูกต้อง" : ""}
            name="email"
            placeholder="กรอกอีเมลของคุณ"
            type="email"
          />

          <Input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            isRequired
            label="รหัสผ่าน"
            labelPlacement="outside"
            errorMessage={isSubmitted && !password ? "กรุณากรอกรหัสผ่าน" : ""}
            name="password"
            placeholder="กรอกรหัสผ่านของคุณ"
            type="password"
          />

          <Input
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            isRequired
            label="ยืนยันรหัสผ่าน"
            labelPlacement="outside"
            errorMessage={isSubmitted && !confirmPassword ? "กรุณายืนยันรหัสผ่าน" : (isSubmitted && password !== confirmPassword ? "รหัสผ่านไม่ตรงกัน" : "")}
            name="passwordConfirm"
            placeholder="ยืนยันรหัสผ่านของคุณ"
            type="password"
          />
          <Button type="submit" variant="bordered">
            Submit
          </Button>
        </Form>
        <p>Already have a account? go to <Link href='/login'>Login</Link></p>
      </div>
    </div>
  )
}