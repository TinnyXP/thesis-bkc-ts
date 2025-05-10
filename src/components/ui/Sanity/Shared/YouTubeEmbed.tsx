// src/components/ui/Sanity/Place/YouTubeEmbed.tsx
"use client";

import React from 'react';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

export default function YouTubeEmbed({ url, title = "YouTube video" }: YouTubeEmbedProps) {
  // แปลง URL ธรรมดาเป็น embed URL
  const getEmbedUrl = (youtubeUrl: string): string => {
    try {
      // รองรับรูปแบบ URL ต่างๆ ของ YouTube
      let videoId = '';
      
      // รูปแบบ URL แบบยาว (youtube.com/watch?v=VIDEO_ID)
      if (youtubeUrl.includes('youtube.com/watch')) {
        const url = new URL(youtubeUrl);
        videoId = url.searchParams.get('v') || '';
      } 
      // รูปแบบ URL แบบสั้น (youtu.be/VIDEO_ID)
      else if (youtubeUrl.includes('youtu.be')) {
        const parts = youtubeUrl.split('/');
        videoId = parts[parts.length - 1].split('?')[0];
      }
      // รูปแบบ URL แบบฝังตัว (youtube.com/embed/VIDEO_ID)
      else if (youtubeUrl.includes('youtube.com/embed')) {
        const parts = youtubeUrl.split('/');
        videoId = parts[parts.length - 1].split('?')[0];
      }
      
      if (!videoId) {
        throw new Error('ไม่สามารถแยกรหัสวิดีโอได้');
      }
      
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการแปลง YouTube URL:', error);
      return '';
    }
  };

  const embedUrl = getEmbedUrl(url);
  
  if (!embedUrl) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <p className="text-red-600 dark:text-red-400">ไม่สามารถแสดงวิดีโอได้ URL ไม่ถูกต้อง</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden mb-6 w-full aspect-video">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}