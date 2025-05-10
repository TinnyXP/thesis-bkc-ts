import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // ตรวจสอบว่ามี URI หรือไม่
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error("MONGODB_URI is not defined in environment variables");
      return;
    }
    
    console.log("Connecting to MongoDB with URI:", uri); // เพิ่ม log เพื่อตรวจสอบ
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}