"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader, Divider, Button } from "@heroui/react";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
  let errorDetails = "";
  
  // แปลความหมายของรหัสข้อผิดพลาด
  switch (error) {
    case "AccessDenied":
      errorMessage = "การเข้าถึงถูกปฏิเสธ";
      errorDetails = "คุณอาจไม่ได้รับอนุญาตให้เข้าสู่ระบบ หรือมีปัญหาในการตั้งค่า LINE Login";
      break;
    case "Configuration":
      errorMessage = "ข้อผิดพลาดในการตั้งค่า";
      errorDetails = "มีปัญหาในการตั้งค่าการเข้าสู่ระบบ โปรดติดต่อผู้ดูแลระบบ";
      break;
    // เพิ่มกรณีอื่นๆ ตามต้องการ
  }
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-4 p-6">
          <h1 className="text-2xl font-bold text-center text-red-600">ข้อผิดพลาดในการเข้าสู่ระบบ</h1>
        </CardHeader>
        
        <Divider />
        
        <CardBody className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{errorMessage}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{errorDetails}</p>
            <p className="text-gray-500 text-sm mb-6">รหัสข้อผิดพลาด: {error}</p>
            
            <div className="flex flex-col gap-3">
              <Button
                as={Link}
                href="/login"
                color="primary"
              >
                ลองเข้าสู่ระบบอีกครั้ง
              </Button>
              
              <Button
                as={Link}
                href="/"
                variant="flat"
              >
                กลับไปยังหน้าหลัก
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}