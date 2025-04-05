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
import { X, Download, FileType } from 'lucide-react';
import { FaCheckCircle } from 'react-icons/fa';

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

/**
 * คอมโพเนนต์รูปภาพที่มีโมดัลแสดงรูปภาพขนาดใหญ่และดาวน์โหลดได้
 */
const ImageWithModal: React.FC<ImageWithModalProps> = ({
  src,
  originalSrc,
  alt,
  className
}) => {
  
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageType, setImageType] = useState('IMAGE');
  const [isMobile, setIsMobile] = useState(false);

  // เก็บเวลาเริ่มคลิกเพื่อใช้แยกระหว่างการคลิกกับการลาก
  const clickStartTime = useRef<number>(0);
  const CLICK_DURATION_THRESHOLD = 200; // ถ้าคลิกน้อยกว่า 200ms ถือว่าเป็นการคลิก ไม่ใช่ลาก

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const modalSrc = originalSrc || src;

  // ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent =
        typeof window !== 'undefined' ? window.navigator.userAgent : '';
      const mobile = Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      );
      setIsMobile(mobile);
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
      // หาประเภทไฟล์จากนามสกุล
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

  /**
   * ฟังก์ชันแสดง Toast notification
   * จะไม่แสดงถ้าอยู่บนอุปกรณ์มือถือ
   */
  const showToast = (options: ToastOptions) => {
    // ไม่แสดง Toast บนอุปกรณ์มือถือ
    if (!isMobile) {
      addToast(options);
    }
  };

  /**
   * ฟังก์ชันสำหรับดาวน์โหลดรูปภาพ
   */
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
      // เตรียมข้อมูลสำหรับการดาวน์โหลด
      const encodedUrl = encodeURIComponent(originalSrc);

      // เรียกใช้ API Route โดยส่งเฉพาะ URL ของรูปภาพ
      const response = await fetch(`/api/download?url=${encodedUrl}`);

      if (!response.ok) {
        // ถ้าเป็น JSON จะพยายามแปลงเป็น object
        let errorMessage = 'เกิดข้อผิดพลาดในการดาวน์โหลด';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // ถ้าไม่ใช่ JSON ให้อ่านเป็นข้อความธรรมดา
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      // ดึงชื่อไฟล์จาก Content-Disposition header (ถ้ามี)
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition?.match(/filename="(.+?)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : 'bkc_image.jpg';

      // ดาวน์โหลดไฟล์
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);

      // แสดง toast แจ้งว่าดาวน์โหลดสำเร็จ (เฉพาะบนเดสก์ท็อป)
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

  /**
   * ฟังก์ชันจัดการการคลิกรูปภาพ
   * แยกระหว่างการคลิกกับการลากโดยใช้เวลา
   */
  const handleImageClick = () => {
    // ถ้ากำลังลากอยู่ ไม่ถือว่าเป็นการคลิก
    if (isDragging) return;

    // คำนวณว่าเป็นการคลิกที่สั้นพอที่จะถือว่าเป็นการคลิก ไม่ใช่การลาก
    const clickEndTime = Date.now();
    const clickDuration = clickEndTime - clickStartTime.current;

    // ถ้าเป็นการคลิกสั้นๆ (ไม่ใช่การกดค้าง) ให้สลับโหมดซูม
    if (clickDuration < CLICK_DURATION_THRESHOLD) {
      // สลับสถานะ zoom
      setIsZoomed(!isZoomed);

      // รีเซ็ตตำแหน่งเมื่อย่อกลับ
      if (isZoomed) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  // ฟังก์ชันสำหรับคำนวณขอบเขตการลาก
  const calculateDragBounds = (clientX: number, clientY: number) => {
    // คำนวณตำแหน่งใหม่
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;

    // คำนวณขอบเขตการลากโดยใช้ขนาดของ container และรูปภาพ
    const container = imageContainerRef.current;
    const image = imageRef.current;

    if (container && image) {
      // คำนวณพื้นที่ที่มองเห็นได้
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // คำนวณขนาดรูปภาพที่ถูกซูม (1.5 เท่า)
      const zoomedWidth = image.clientWidth * 1.5;
      const zoomedHeight = image.clientHeight * 1.5;

      // คำนวณระยะที่สามารถลากได้ให้เห็นสุดขอบของรูปภาพ
      const maxX = Math.max(0, (zoomedWidth - containerWidth) / 2);
      const maxY = Math.max(0, (zoomedHeight - containerHeight) / 2);

      // เพิ่มค่า offset เพื่อให้สามารถลากไปถึงสุดมุมได้
      const adjustedMaxX = maxX * 1.2;
      const adjustedMaxY = maxY * 1.2;

      return {
        x: Math.max(Math.min(newX, adjustedMaxX), -adjustedMaxX),
        y: Math.max(Math.min(newY, adjustedMaxY), -adjustedMaxY)
      };
    } else {
      // หากไม่สามารถอ้างอิงองค์ประกอบได้ ใช้ค่าที่กำหนดไว้ล่วงหน้า
      const maxDistance = 500;
      return {
        x: Math.max(Math.min(newX, maxDistance), -maxDistance),
        y: Math.max(Math.min(newY, maxDistance), -maxDistance)
      };
    }
  };

  // ฟังก์ชันจัดการการลากรูปภาพ (mouse events)
  const handleMouseDown = (e: React.MouseEvent) => {
    // บันทึกเวลาเริ่มคลิก
    clickStartTime.current = Date.now();

    // ถ้าไม่ได้ซูมอยู่ ไม่ต้องทำอะไร
    if (!isZoomed) return;

    // เริ่มการลาก
    setIsDragging(true);

    // บันทึกจุดเริ่มต้นของการลาก
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });

    // ป้องกันการเลือกข้อความ
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // ถ้าไม่ได้อยู่ในโหมดลาก ไม่ต้องทำอะไร
    if (!isDragging) return;

    // คำนวณและตั้งค่าตำแหน่งใหม่
    setPosition(calculateDragBounds(e.clientX, e.clientY));
  };

  const handleMouseUp = () => {
    // จบการลาก แต่ยังคงอยู่ที่ตำแหน่งเดิม
    setIsDragging(false);
  };

  // จัดการเหตุการณ์เมื่อเมาส์ออกนอกพื้นที่
  const handleMouseLeave = () => {
    // จบการลาก แต่ยังคงอยู่ที่ตำแหน่งเดิม
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // ถ้าไม่ได้ซูมอยู่ ไม่ต้องทำอะไร
    if (!isZoomed) return;

    // บันทึกเวลาเริ่มสัมผัส
    clickStartTime.current = Date.now();

    // เริ่มการลาก
    setIsDragging(true);

    // บันทึกจุดเริ่มต้นของการลาก (ใช้ touch แรก)
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });

    // ป้องกัน default action (เช่น การเลื่อนหน้าจอ)
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // ถ้าไม่ได้อยู่ในโหมดลาก ไม่ต้องทำอะไร
    if (!isDragging) return;

    // ใช้ touch แรก
    const touch = e.touches[0];

    // คำนวณและตั้งค่าตำแหน่งใหม่
    setPosition(calculateDragBounds(touch.clientX, touch.clientY));

    // ป้องกัน default action (เช่น การเลื่อนหน้าจอ)
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    // คำนวณว่าเป็นการแตะที่สั้นพอที่จะถือว่าเป็นการคลิก ไม่ใช่การลาก
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - clickStartTime.current;

    // ถ้าไม่ได้ลากเลย (แตะสั้นๆ) ให้สลับโหมดซูม
    if (touchDuration < CLICK_DURATION_THRESHOLD && !isDragging) {
      // สลับสถานะ zoom
      setIsZoomed(!isZoomed);

      // รีเซ็ตตำแหน่งเมื่อย่อกลับ
      if (isZoomed) {
        setPosition({ x: 0, y: 0 });
      }
    }

    // จบการลาก แต่ยังคงอยู่ที่ตำแหน่งเดิม
    setIsDragging(false);
  };

  // สร้าง style object สำหรับรูปภาพที่ซูม
  const getImageStyle = () => {
    if (isZoomed) {
      // ใช้อัตราส่วนการเคลื่อนที่ที่เหมาะสมเพื่อให้การลากดูเป็นธรรมชาติ
      // ค่าหารที่น้อยลงจะทำให้ภาพเคลื่อนที่ได้ไกลขึ้นเมื่อลาก
      return {
        transform: `scale(1.5) translate(${position.x / 2}px, ${position.y / 2}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        cursor: isDragging ? 'grabbing' : 'grab',
        // เพิ่ม CSS transform-origin เพื่อให้แน่ใจว่าการซูมจะอยู่ตรงกลาง
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
        size="5xl"
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
                onClick={handleImageClick}
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
                  {/* ข้อมูลประเภทไฟล์ (ไม่แสดงขนาดไฟล์) */}
                  <div className="bg-zinc-800/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto">
                    <FileType size={16} />
                    <span className="text-sm font-medium">{imageType}</span>
                  </div>

                  {/* ปุ่มปิด */}
                  <Button
                    isIconOnly
                    radius='full'
                    variant="flat"
                    className="bg-zinc-800/50 hover:bg-zinc-800/70 backdrop-blur-sm text-white pointer-events-auto"
                    onPress={onClose}
                    aria-label="ปิดโมดัล"
                  >
                    <X size={18} />
                  </Button>
                </div>

                {/* ปุ่มดาวน์โหลด (แสดงเมื่อมี originalSrc) */}
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
                        {isDownloading ? <Spinner size="sm" color="white" /> : <Download size={20} />}
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
};

export default ImageWithModal;