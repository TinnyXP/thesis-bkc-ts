'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
  useDisclosure,
  Image,
  Tooltip,
  Spinner,
  addToast
} from "@heroui/react";
import { FaCheckCircle } from 'react-icons/fa';
import { IoClose, IoCloudDownload, IoDocumentText } from 'react-icons/io5';

interface ImageWithModalProps {
  src: string;
  originalSrc?: string | null;
  alt: string;
  className?: string;
}

interface ToastOptions {
  title: string;
  description?: string;
  color?: "default" | "foreground" | "primary" | "secondary" | "success" | "warning" | "danger";
  timeout?: number;
  hideCloseButton?: boolean;
  shouldShowTimeoutProgress?: boolean;
  icon?: React.ReactNode;
  classNames?: {
    base?: string;
    title?: string;
    description?: string;
  };
  radius?: "none" | "sm" | "md" | "lg" | "full";
}

export default function ImageModal({
  src,
  originalSrc,
  alt,
  className
}: ImageWithModalProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageType, setImageType] = useState('IMAGE');
  const [isMobile, setIsMobile] = useState(false);

  const clickStartTime = useRef<number>(0);
  const CLICK_DURATION_THRESHOLD = 200;

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const modalSrc = originalSrc || src;

  // ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
      setIsMobile(Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i)));
    };
    checkIfMobile();
  }, []);

  // ดึงข้อมูลของรูปภาพเมื่อเปิดโมดัล
  useEffect(() => {
    if (isOpen && originalSrc) {
      detectImageType(originalSrc);
    }

    // รีเซ็ตเมื่อปิดโมดัล
    if (!isOpen) {
      setIsZoomed(false);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, originalSrc]);

  // ฟังก์ชันตรวจสอบประเภทไฟล์จาก URL
  const detectImageType = (imageUrl: string) => {
    try {
      let fileType = 'IMAGE';
      const fileExtMatch = imageUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      if (fileExtMatch && fileExtMatch[1]) {
        const ext = fileExtMatch[1].toLowerCase();
        if (['jpg', 'jpeg'].includes(ext)) fileType = 'JPEG';
        else if (ext === 'png') fileType = 'PNG';
        else if (ext === 'webp') fileType = 'WEBP';
        else if (ext === 'gif') fileType = 'GIF';
        else if (ext === 'svg') fileType = 'SVG';
      }
      setImageType(fileType);
    } catch (error) {
      console.error('Error detecting image type:', error);
      setImageType('IMAGE');
    }
  };

  // แสดง Toast notification
  const showToast = (options: ToastOptions) => {
    if (!isMobile) {
      addToast(options);
    }
  };

  // ฟังก์ชันสำหรับดาวน์โหลดรูปภาพ
  const handleDownload = async () => {
    if (!originalSrc) {
      showToast({
        title: "ไม่พบลิงก์สำหรับดาวน์โหลด",
        description: "ไม่สามารถดาวน์โหลดรูปภาพนี้ได้",
        color: "danger",
        timeout: 3000,
        classNames: {
          base: "font-[family-name:var(--font-line-seed-sans)]",
        }
      });
      return;
    }

    setIsDownloading(true);
    try {
      const encodedUrl = encodeURIComponent(originalSrc);
      const response = await fetch(`/api/download?url=${encodedUrl}`);

      if (!response.ok) {
        let errorMessage = 'เกิดข้อผิดพลาดในการดาวน์โหลด';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition?.match(/filename="(.+?)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : 'bkc_image.jpg';

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);

      showToast({
        title: "ดาวโหลดรูปภาพไปยังอุปกรณ์เรียบร้อย",
        color: "success",
        radius: "full",
        timeout: 3000,
        hideCloseButton: true,
        shouldShowTimeoutProgress: true,
        icon: <FaCheckCircle className="h-4 w-4" />,
        classNames: {
          base: "font-[family-name:var(--font-line-seed-sans)]",
          title: "font-semibold"
        }
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดาวน์โหลด:', error);
      showToast({
        title: error instanceof Error ? error.message : 'ไม่สามารถดาวน์โหลดรูปภาพได้',
        color: "danger",
        radius: "full",
        timeout: 3000,
        hideCloseButton: true,
        shouldShowTimeoutProgress: true,
        classNames: {
          base: "font-[family-name:var(--font-line-seed-sans)]",
          title: "font-semibold"
        }
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // จัดการการทำงานทั้งแบบคลิกและลาก
  const handleImageInteraction = (isClick: boolean) => {
    if (isDragging && isClick) return;
    
    const clickEndTime = Date.now();
    const clickDuration = clickEndTime - clickStartTime.current;
    
    if (clickDuration < CLICK_DURATION_THRESHOLD || !isClick) {
      setIsZoomed(!isZoomed);
      if (isZoomed) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  // คำนวณขอบเขตการลาก
  const calculateDragBounds = (clientX: number, clientY: number) => {
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    const container = imageContainerRef.current;
    const image = imageRef.current;

    if (container && image) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const zoomedWidth = image.clientWidth * 1.5;
      const zoomedHeight = image.clientHeight * 1.5;
      const maxX = Math.max(0, (zoomedWidth - containerWidth) / 2) * 1.2;
      const maxY = Math.max(0, (zoomedHeight - containerHeight) / 2) * 1.2;

      return {
        x: Math.max(Math.min(newX, maxX), -maxX),
        y: Math.max(Math.min(newY, maxY), -maxY)
      };
    }
    
    // ค่าเริ่มต้น
    const maxDistance = 500;
    return {
      x: Math.max(Math.min(newX, maxDistance), -maxDistance),
      y: Math.max(Math.min(newY, maxDistance), -maxDistance)
    };
  };

  // Event handlers สำหรับ mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    clickStartTime.current = Date.now();
    if (!isZoomed) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition(calculateDragBounds(e.clientX, e.clientY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Event handlers สำหรับ touch
  const handleTouchStart = (e: React.TouchEvent) => {
    clickStartTime.current = Date.now();
    if (!isZoomed) return;

    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition(calculateDragBounds(touch.clientX, touch.clientY));
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - clickStartTime.current;

    if (touchDuration < CLICK_DURATION_THRESHOLD && !isDragging) {
      handleImageInteraction(false);
    }
    setIsDragging(false);
  };

  // สร้าง style object สำหรับรูปภาพที่ซูม
  const getImageStyle = () => {
    if (isZoomed) {
      return {
        transform: `scale(1.5) translate(${position.x / 2}px, ${position.y / 2}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        cursor: isDragging ? 'grabbing' : 'grab',
        transformOrigin: 'center center'
      };
    }
    return {
      transform: 'scale(1)',
      transition: 'transform 0.3s ease-out',
      cursor: 'zoom-in',
      transformOrigin: 'center center'
    };
  };

  return (
    <div>
      {/* รูปภาพแบบย่อ */}
      <Image
        src={src}
        alt={alt}
        className={`cursor-pointer ${className}`}
        onClick={onOpen}
        loading="lazy"
      />

      {/* โมดัลแสดงรูปภาพขนาดใหญ่ */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="3xl"
        hideCloseButton
        backdrop='blur'
        classNames={{
          base: "bg-transparent shadow-none",
          body: "p-0",
        }}
        placement='center'
        motionProps={{
          variants: {
            enter: {
              opacity: 1,
              scale: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut"
              }
            },
            exit: {
              opacity: 0,
              scale: 0.95,
              transition: {
                duration: 0.2,
                ease: "easeIn"
              }
            }
          },
          initial: { opacity: 0, scale: 0.95 }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <ModalBody className='p-0 relative'>
              {/* คอนเทนเนอร์สำหรับรูปภาพ */}
              <div
                ref={imageContainerRef}
                className="relative overflow-hidden select-none"
                style={{ touchAction: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleImageInteraction(true)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div style={getImageStyle()}>
                  <Image
                    ref={imageRef}
                    src={modalSrc}
                    alt={alt}
                    className="w-full h-auto rounded-lg pointer-events-none"
                    loading="eager"
                    draggable={false}
                  />
                </div>

                {/* แถบควบคุมด้านบน */}
                <div className="absolute top-3 left-0 right-0 flex justify-between items-center px-3 z-10 pointer-events-none">
                  <div className="bg-zinc-800/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto">
                    <IoDocumentText size={16} />
                    <span className="text-sm font-medium">{imageType}</span>
                  </div>

                  <Button
                    isIconOnly
                    radius='full'
                    variant="flat"
                    className="bg-zinc-800/50 hover:bg-zinc-800/70 backdrop-blur-sm text-white pointer-events-auto"
                    onPress={onClose}
                    aria-label="ปิดโมดัล"
                  >
                    <IoClose size={18} />
                  </Button>
                </div>

                {/* ปุ่มดาวน์โหลด */}
                {originalSrc && (
                  <div className="absolute bottom-3 right-3 z-10 pointer-events-auto">
                    <Tooltip
                      content="ดาวน์โหลดรูปภาพ"
                      placement="top"
                      classNames={{ base: "font-[family-name:var(--font-line-seed-sans)]" }}
                    >
                      <Button
                        isIconOnly
                        radius='full'
                        isLoading={isDownloading}
                        onPress={handleDownload}
                        disabled={isDownloading}
                        className="bg-primary-color/90 hover:bg-primary-color backdrop-blur-sm text-white shadow-lg hover:shadow-xl transition-all"
                        aria-label="ดาวน์โหลดรูปภาพ"
                      >
                        {isDownloading ? <Spinner size="sm" color="white" /> : <IoCloudDownload size={20} />}
                      </Button>
                    </Tooltip>
                  </div>
                )}

                {/* คำแนะนำในการซูม/ลาก */}
                <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                  <div className="bg-zinc-800/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {isZoomed
                      ? (isDragging ? 'กำลังลาก...' : (isMobile ? 'แตะค้างเพื่อลาก หรือแตะเพื่อย่อ' : 'กดค้างเพื่อลาก หรือคลิกเพื่อย่อ'))
                      : (isMobile ? 'แตะเพื่อขยาย' : 'คลิกเพื่อขยาย')
                    }
                  </div>
                </div>
              </div>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}