"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button, Slider, Tooltip } from "@heroui/react";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // สร้าง audio element และตั้งค่า event listeners
  useEffect(() => {
    // เก็บค่าเริ่มต้นไว้เพื่อใช้ในการสร้าง audio element
    const initialVolume = volume;
    const initialMuted = isMuted;
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Log เพื่อตรวจสอบ
    console.log("Loading audio:", audioUrl);
    
    // ตั้งค่า volume เริ่มต้น
    audio.volume = initialVolume;
    audio.muted = initialMuted;
    
    const handleLoadedMetadata = () => {
      console.log("Metadata loaded, duration:", audio.duration);
      setDuration(audio.duration);
      setIsLoaded(true);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // เพิ่มการรีเซ็ตเวลาไปที่จุดเริ่มต้นเมื่อเล่นจบ
      audio.currentTime = 0;
      setCurrentTime(0);
    };
    
    // แก้ไขปัญหา duration ไม่โหลด ด้วยการเพิ่ม timeout
    const metadataTimeout = setTimeout(() => {
      if (!isLoaded && audio.duration > 0) {
        console.log("Timeout triggered duration:", audio.duration);
        setDuration(audio.duration);
        setIsLoaded(true);
      } else if (!isLoaded) {
        console.log("Still no duration after timeout, using default");
        setDuration(100); // ใช้ค่าเริ่มต้นถ้ายังโหลดไม่ได้
        setIsLoaded(true);
      }
    }, 2000);
    
    // เพิ่ม event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    // ลอง load เลย
    audio.load();
    
    // Clean up เมื่อ component unmount
    return () => {
      clearTimeout(metadataTimeout);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  // แยก useEffect สำหรับการจัดการ volume และ muted
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // ฟังก์ชันจัดการเวลาที่แสดง
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ฟังก์ชันควบคุมการเล่น/หยุด
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error("Error playing audio:", error);
              setIsPlaying(false);
            });
        }
      }
    } catch (error) {
      console.error("Toggle play error:", error);
    }
  };

  // ฟังก์ชันควบคุมระดับเสียง
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // ฟังก์ชันตั้งค่าเวลาที่เล่น
  const handleTimeChange = (value: number | number[]) => {
    if (!audioRef.current) return;
    
    const newTime = Array.isArray(value) ? value[0] : value;
    if (isNaN(newTime) || !isFinite(newTime)) return;
    
    try {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (error) {
      console.error("Error setting time:", error);
    }
  };
  
  const handleVolumeChange = (value: number | number[]) => {
    if (!audioRef.current) return;
    
    const newVolume = Array.isArray(value) ? value[0] : value;
    if (isNaN(newVolume)) return;
    
    try {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      
      if (newVolume === 0) {
        audioRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    } catch (error) {
      console.error("Error setting volume:", error);
    }
  };

  // กำหนด max value สำหรับ slider
  const maxValue = isLoaded && duration > 0 ? duration : 100;

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 mb-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            radius="full"
            color="primary"
            onPress={togglePlay}
            className="min-w-10 h-10"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </Button>
          
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm min-w-[40px] text-center">{formatTime(currentTime)}</span>
            <Slider
              value={currentTime}
              onChange={handleTimeChange}
              className="flex-1"
              minValue={0}
              maxValue={maxValue}
              step={0.1}
              aria-label="เวลาการเล่นเสียง"
              size="md"
              color="primary"
            />
            <span className="text-sm min-w-[40px] text-center">{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content={isMuted ? "เปิดเสียง" : "ปิดเสียง"}>
              <Button
                isIconOnly
                variant="light"
                onPress={toggleMute}
                aria-label={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
              >
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </Button>
            </Tooltip>
            <Slider
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20"
              minValue={0}
              maxValue={1}
              step={0.01}
              aria-label="ระดับเสียง"
              size="md"
              color="primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}