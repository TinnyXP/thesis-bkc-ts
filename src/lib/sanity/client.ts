// src/lib/sanity/client.ts
import { createClient } from "next-sanity";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, 
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  useCdn: process.env.NEXT_PUBLIC_SANITY_USE_CDN === "true",
});

// ตัวเลือกสำหรับการดึงข้อมูล
export const defaultRevalidateOptions = { 
  next: { 
    revalidate: 60, // 60 วินาที
  } 
};

export const fastRevalidateOptions = { 
  next: { 
    revalidate: 10, // 10 วินาที
  } 
};