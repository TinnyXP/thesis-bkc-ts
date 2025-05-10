// src/lib/sanity/image.ts
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "./client";

// ตัวสร้าง URL สำหรับรูปภาพจาก Sanity
const { projectId, dataset } = client.config();

/**
 * สร้าง URL สำหรับรูปภาพจาก Sanity
 * @param source SanityImageSource
 * @returns ตัวสร้าง URL สำหรับรูปภาพ
 */
export const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

/**
 * สร้าง URL สำหรับรูปภาพปก
 * @param source SanityImageSource
 * @param width ความกว้าง
 * @returns URL ของรูปภาพ
 */
export const getThumbnailUrl = (source: SanityImageSource, width = 768) => {
  const imageBuilder = urlFor(source);
  return imageBuilder ? `${imageBuilder.width(width).auto("format").url()}` : null;
};

/**
 * สร้าง URL สำหรับรูปภาพต้นฉบับ
 * @param source SanityImageSource
 * @returns URL ของรูปภาพ
 */
export const getOriginalImageUrl = (source: SanityImageSource) => {
  const imageBuilder = urlFor(source);
  return imageBuilder ? imageBuilder.url() : null;
};