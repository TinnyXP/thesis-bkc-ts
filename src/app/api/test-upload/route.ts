import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: "No file uploaded" 
      }, { status: 400 });
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        message: "Only image files are allowed" 
      }, { status: 400 });
    }

    const result = await uploadToCloudinary(file);

    if (!result) {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to upload image" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Image uploaded successfully",
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ 
      success: false, 
      message: "An error occurred while uploading the image",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}