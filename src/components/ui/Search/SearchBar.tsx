// src/components/ui/Search/SearchBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Input, Button, Tooltip } from "@heroui/react";
import { FaSearch, FaMicrophone, FaStop } from "react-icons/fa";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { AiFillAlipayCircle } from "react-icons/ai";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  contentType?: 'blog' | 'place';
  className?: string;
}

export default function SearchBar({
  placeholder,
  onSearch,
  contentType = 'blog',
  className = ""
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  
  // สร้างฟังก์ชันที่จะเรียกเมื่อมีข้อความใหม่
  const { transcript, listening, browserSupportsSpeechRecognition, resetTranscript } = useSpeechRecognition({
    commands: [{
      command: '*',
      callback: (command) => {
        setSearchTerm(command);
      },
      matchInterim: true
    }]
  });

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // อัพเดต searchTerm เมื่อ transcript เปลี่ยน
  useEffect(() => {
    if (transcript) {
      setSearchTerm(transcript);
    }
  }, [transcript]);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      // เริ่มบันทึกเสียงด้วยภาษาไทย
      SpeechRecognition.startListening({ 
        continuous: true, 
        language: 'th-TH' 
      });
    }
  };

  // ค้นหาเมื่อกด Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(searchTerm);
    }
  };

  // ล้างการค้นหา
  const handleClear = () => {
    setSearchTerm("");
    resetTranscript();
    onSearch("");
    // หยุดการบันทึกเสียงเมื่อล้างข้อความ
    if (listening) {
      SpeechRecognition.stopListening();
    }
  };

  // เมื่อกดปุ่มค้นหา
  const handleSearch = () => {
    onSearch(searchTerm);
  };

  // เมื่อมีการเปลี่ยนแปลงค่า searchTerm
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (!isMounted) {
    return null; // ป้องกัน hydration error
  }

  const searchPlaceholder = placeholder ||
    (contentType === 'blog' ? "ค้นหาบทความ..." : "ค้นหาสถานที่ท่องเที่ยว...");

  return (
    <div className={`flex gap-2 w-full ${className}`}>
      <div className="relative flex-1">
        <Input
          isClearable
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={searchPlaceholder}
          variant="flat"
          size="md"
          radius="full"
          onKeyPress={handleKeyPress}
          onClear={handleClear}
          startContent={<FaSearch className="text-default-400" />}
          endContent={
            listening && (
              <div className="flex items-center">
                <span className="animate-pulse text-primary-color mr-2 text-xs">กำลังฟัง...</span>
              </div>
            )
          }
          classNames={{
            input: "text-md",
          }}
        />
      </div>

      <div className="flex gap-2">
        {browserSupportsSpeechRecognition && (
          <Tooltip content={listening ? "หยุด" : "พูดเพื่อค้นหา"}>
            <Button
              isIconOnly
              color={listening ? "danger" : "primary"}
              variant={listening ? "solid" : "ghost"}
              radius="full"
              onPress={toggleListening}
            >
              {listening ? <FaStop size={16} /> : <FaMicrophone size={18} />}
            </Button>
          </Tooltip>
        )}
        
        <Button
          isIconOnly
          color="primary"
          radius="full"
          onPress={handleSearch}
        >
          <FaSearch size={18} />
        </Button>
      </div>
    </div>
  );
}