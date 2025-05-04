// src/components/ui/Sanity/Place/AudioPlayer.tsx
"use client";

import React, { useState, useRef } from 'react';
import { Button, Slider, Tooltip } from "@heroui/react";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
}

export default function AudioPlayer({ audioUrl, title = "Audio guide" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ฟังก์ชันจัดการเวลาที่แสดง
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ฟังก์ชันควบคุมการเล่น/หยุด
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // ฟังก์ชันควบคุมระดับเสียง
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // ฟังก์ชันตั้งค่าเวลาที่เล่น
  const handleTimeChange = (value: number | number[]) => {
    if (audioRef.current) {
      const newTime = Array.isArray(value) ? value[0] : value;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleVolumeChange = (value: number | number[]) => {
    if (audioRef.current) {
      const newVolume = Array.isArray(value) ? value[0] : value;
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  // เหตุการณ์ที่เกิดขึ้นขณะเล่นไฟล์เสียง
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 mb-6">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />
      
      <div className="flex flex-col gap-2">
        {title && (
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
        )}
        
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
            <span className="text-sm">{formatTime(currentTime)}</span>
            <Slider
              value={currentTime}
              onChange={handleTimeChange}
              className="flex-1"
              minValue={0}
              maxValue={duration || 100}
              step={0.1}
            />
            <span className="text-sm">{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content={isMuted ? "Unmute" : "Mute"}>
              <Button
                isIconOnly
                variant="light"
                onPress={toggleMute}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}