"use client"

import React, { useState } from 'react'

import { Form, Input, Button, Link } from "@heroui/react";

export default function page() {
  return (
    <div>
      <div className='container mx-auto'>
        <h1 className='text-3xl font-bold text-center'>Register</h1>
        <Form>
          <Input
            isRequired label="Username" labelPlacement="outside"
            errorMessage="Please enter a valid email"
            name="username"
            placeholder="Enter your username"
            type="text"
          />
          <Input
            isRequired label="Password" labelPlacement="outside"
            errorMessage="Please enter a valid email"
            name="password"
            placeholder="Enter your passowrd"
            type="password"
          />
          <Button type="submit" variant="bordered">
            Submit
          </Button>
        </Form>
        <p>Already have a account? go to <Link href='/register'>Register</Link></p>
      </div>
    </div>
  )
}
