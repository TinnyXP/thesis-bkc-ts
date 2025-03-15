'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
  useDisclosure,
  Image,
  Tooltip,
  Spinner
} from "@heroui/react";
import { X, Download } from "lucide-react";
import { ImageMetadata } from '@/types';
import { createSafeFileName } from '@/utils/helpers';

interface ImageWithModalProps extends ImageMetadata {
  className?: string;
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
  const modalSrc = originalSrc || src;

  /**
   * ฟังก์ชันสำหรับดาวน์โหลดรูปภาพ
   */
  const handleDownload = async () => {
    if (!originalSrc) {
      alert('ไม่พบลิงก์สำหรับดาวน์โหลดรูปภาพ');
      return;
    }

    setIsDownloading(true);
    try {
      // เตรียมข้อมูลสำหรับดาวน์โหลด
      const fileName = createSafeFileName(alt);
      const encodedUrl = encodeURIComponent(originalSrc);

      // เรียกใช้ API Route
      const response = await fetch(`/api/download?url=${encodedUrl}&filename=${encodeURIComponent(fileName)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการดาวน์โหลด');
      }

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
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดาวน์โหลด:', error);
      alert(error instanceof Error ? error.message : 'ไม่สามารถดาวน์โหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <Image
        src={src}
        alt={alt}
        className={`cursor-pointer ${className}`}
        onClick={onOpen}
        loading="lazy"
      />

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        hideCloseButton
        classNames={{
          body: "p-0",
        }}
        backdrop='blur'
        placement='auto'
      >
        <ModalContent>
          {(onClose) => (
            <div>
              <ModalBody className='p-1.5'>
                <div className="relative">
                  <Image
                    src={modalSrc}
                    alt={alt}
                    className="w-full h-auto"
                    loading="eager"
                  />
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    {originalSrc && (
                      <Tooltip
                        content={
                          <div className="font-[family-name:var(--font-line-seed-sans)] text-center">
                            <div>ดาวน์โหลด</div>
                          </div>
                        }
                      >
                        <Button
                          isIconOnly
                          radius='full'
                          isLoading={isDownloading}
                          onPress={handleDownload}
                          disabled={isDownloading}
                          className="bg-zinc-500/50 backdrop-blur-sm hover:bg-zinc-500/70 text-white"
                          aria-label="ดาวน์โหลดรูปภาพ"
                        >
                          {isDownloading ? <Spinner size="sm" /> : <Download size={22} />}
                        </Button>
                      </Tooltip>
                    )}
                    <Button
                      isIconOnly
                      radius='full'
                      color="danger"
                      onPress={onClose}
                      className="bg-zinc-500/50 backdrop-blur-sm hover:bg-zinc-500/70 text-white"
                      aria-label="ปิดโมดัล"
                    >
                      <X size={22} />
                    </Button>
                  </div>
                </div>
              </ModalBody>
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ImageWithModal;