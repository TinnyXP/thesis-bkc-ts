"use client";

import React from "react";
import { RadioProps } from "@heroui/react";
import { useRadio, useRadioGroupContext, VisuallyHidden } from "@heroui/react";
import { FaStar } from "react-icons/fa";

const RatingRadioItem = React.forwardRef<HTMLInputElement, RadioProps>((props, ref) => {
  const {
    Component,
    isSelected: isSelfSelected,
    isFocusVisible,
    getBaseProps,
    getInputProps,
  } = useRadio(props);

  const groupContext = useRadioGroupContext();

  const isSelected =
    isSelfSelected || Number(groupContext.groupState.selectedValue) >= Number(props.value);
  const isReadOnly = groupContext.groupState.isReadOnly;
  
  // กำหนดขนาดของดาวตาม size ใน props หรือใช้ค่าจาก context หรือค่าเริ่มต้น
  const size = props.size || groupContext.size || "md";
  const color = props.color || groupContext.color || "warning";

  // กำหนดขนาดของไอคอนดาว
  const starSize = React.useMemo(() => {
    switch (size) {
      case "sm":
        return 16;
      case "md":
        return 24;
      case "lg":
        return 32;
      default:
        return 24;
    }
  }, [size]);

  // กำหนดสีของดาว
  const starColor = React.useMemo(() => {
    switch (color) {
      case "primary":
        return "text-primary";
      case "secondary":
        return "text-secondary";
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "danger":
        return "text-danger";
      default:
        return "text-warning";  // ใช้สีเหลืองเป็นค่าเริ่มต้น
    }
  }, [color]);

  const baseProps = getBaseProps();

  return (
    <Component
      {...baseProps}
      ref={ref}
      className={`${baseProps.className} ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <FaStar
        className={`pointer-events-none transition-all ${
          isSelected ? starColor : "text-zinc-200 dark:text-zinc-700"
        } ${
          isFocusVisible 
            ? "ring-2 ring-focus ring-offset-2 ring-offset-background" 
            : ""
        } ${
          !isReadOnly && "group-data-[pressed=true]:scale-90"
        }`}
        size={starSize}
      />
    </Component>
  );
});

RatingRadioItem.displayName = "RatingRadioItem";

export default RatingRadioItem;