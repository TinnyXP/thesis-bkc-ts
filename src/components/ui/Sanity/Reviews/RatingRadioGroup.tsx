"use client";

import React from "react";
import { RadioGroup, RadioGroupProps } from "@heroui/react";

import RatingRadioItem from "./RatingRadioItem";

export interface RatingRadioGroupProps extends RadioGroupProps {
  hideStarsText?: boolean;
  onRatingChange?: (value: string) => void;
}

const RatingRadioGroup = React.forwardRef<HTMLDivElement, RatingRadioGroupProps>(
  ({ className, label, hideStarsText, onRatingChange, value, defaultValue = "1", ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue);
    
    // คำอธิบายตามจำนวนดาวที่เลือก
    const starsText = React.useMemo(() => {
      switch (selectedValue) {
        case "1":
          return "แย่มาก";
        case "2":
          return "แย่";
        case "3":
          return "พอใช้";
        case "4":
          return "ดี";
        case "5":
          return "ดีมาก";
        default:
          return "เลือกคะแนน";
      }
    }, [selectedValue]);

    // จัดการการเปลี่ยนแปลงค่า
    const handleValueChange = (newValue: string) => {
      setSelectedValue(newValue);
      if (onRatingChange) {
        onRatingChange(newValue);
      }
    };

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <RadioGroup
          ref={ref}
          value={selectedValue}
          defaultValue={defaultValue}
          orientation="horizontal"
          onValueChange={handleValueChange}
          {...props}
        >
          <RatingRadioItem value="1" />
          <RatingRadioItem value="2" />
          <RatingRadioItem value="3" />
          <RatingRadioItem value="4" />
          <RatingRadioItem value="5" />
        </RadioGroup>
        {label && label}
        {!hideStarsText && <p className="text-medium text-default-500">{starsText}</p>}
      </div>
    );
  },
);

RatingRadioGroup.displayName = "RatingRadioGroup";

export default RatingRadioGroup;