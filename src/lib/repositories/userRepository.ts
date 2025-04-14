// src/lib/repositories/userRepository.ts
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/user";
import { UserDocument, UserProfile, AuthProvider } from "@/lib/auth/types";
import mongoose, { FilterQuery } from "mongoose";

/**
 * Repository สำหรับจัดการข้อมูลผู้ใช้
 */
export class UserRepository {
  /**
   * ค้นหาผู้ใช้ด้วยวิธีต่างๆ โดยตรวจสอบหลายวิธีอย่างเป็นลำดับ
   * @param identifiers ข้อมูลที่ใช้ระบุตัวตนผู้ใช้
   * @returns ข้อมูลผู้ใช้หรือ null ถ้าไม่พบ
   */
  async findUser(identifiers: {
    id?: string;
    email?: string;
    lineId?: string;
    provider?: string;
  }): Promise<UserDocument | null> {
    await connectDB();
    
    const { id, email, lineId, provider } = identifiers;
    let user: UserDocument | null = null;
    
    // ใช้ chain of responsibility pattern เพื่อค้นหาผู้ใช้ด้วยวิธีต่างๆ
    
    // 1. ค้นหาด้วย MongoDB ObjectId
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      console.log(`UserRepository: Searching user by ID: ${id}`);
      user = await UserModel.findById(id);
      if (user) return user;
    }
    
    // 2. ค้นหาด้วย LINE ID (ถ้ามี)
    if (lineId) {
      console.log(`UserRepository: Searching user by LINE provider_id: ${lineId}`);
      user = await UserModel.findOne({ 
        provider: 'line',
        provider_id: lineId
      });
      if (user) return user;
    }
    
    // 3. ค้นหาด้วย email + provider (ถ้ามีทั้งคู่)
    if (email && provider) {
      console.log(`UserRepository: Searching user by email: ${email} and provider: ${provider}`);
      user = await UserModel.findOne({
        email,
        provider
      });
      if (user) return user;
    }
    
    // 4. ค้นหาด้วย email อย่างเดียว (fallback)
    if (email) {
      console.log(`UserRepository: Searching user by email only: ${email}`);
      user = await UserModel.findOne({ email });
    }
    
    return user;
  }
  
  /**
   * สร้างผู้ใช้ใหม่
   * @param userData ข้อมูลผู้ใช้
   * @returns ข้อมูลผู้ใช้ที่สร้าง
   */
  async createUser(userData: {
    name: string;
    email: string;
    provider: string;
    provider_id?: string;
    profile_image?: string | null;
    bio?: string;
    original_line_data?: {
      name: string;
      email: string;
      profile_image: string | null;
    };
    use_original_data?: boolean;
  }): Promise<UserDocument> {
    await connectDB();
    
    console.log(`UserRepository: Creating new user with email: ${userData.email}, provider: ${userData.provider}`);
    
    const newUser = await UserModel.create({
      ...userData,
      is_active: true,
      role: 'user'
    });
    
    return newUser;
  }
  
  /**
   * อัพเดทข้อมูลผู้ใช้
   * @param id ID ของผู้ใช้
   * @param updateData ข้อมูลที่ต้องการอัพเดท
   * @returns ข้อมูลผู้ใช้ที่อัพเดทแล้ว
   */
  async updateUser(id: string, updateData: Partial<UserDocument>): Promise<UserDocument | null> {
    await connectDB();
    
    console.log(`UserRepository: Updating user with ID: ${id}`);
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // return updated document
    );
    
    return updatedUser;
  }
  
  /**
   * อัพเดทการใช้ข้อมูลต้นฉบับจาก LINE
   * @param id ID ของผู้ใช้
   * @param useOriginalData ใช้ข้อมูลต้นฉบับหรือไม่
   * @returns ข้อมูลผู้ใช้ที่อัพเดทแล้ว
   */
  async updateLineDataUsage(id: string, useOriginalData: boolean): Promise<UserDocument | null> {
    await connectDB();
    
    console.log(`UserRepository: Updating LINE data usage for user: ${id}, use original: ${useOriginalData}`);
    
    const user = await UserModel.findById(id);
    if (!user || user.provider !== 'line' || !user.original_line_data) {
      console.log(`UserRepository: User not found or not a LINE user: ${id}`);
      return null;
    }
    
    // ถ้าต้องการใช้ข้อมูลต้นฉบับ ให้อัพเดทข้อมูลหลักด้วยข้อมูลจาก LINE
    const updateData: any = { use_original_data: useOriginalData };
    
    if (useOriginalData) {
      updateData.name = user.original_line_data.name;
      updateData.profile_image = user.original_line_data.profile_image;
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    return updatedUser;
  }
  
  /**
   * แปลงข้อมูลจาก database schema เป็น UserProfile
   * @param userDoc ข้อมูลผู้ใช้จาก database
   * @returns ข้อมูลผู้ใช้สำหรับ application
   */
  mapToUserProfile(userDoc: UserDocument): UserProfile {
    return {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      image: userDoc.profile_image,
      bio: userDoc.bio || "",
      provider: userDoc.provider as AuthProvider,
      useOriginalData: userDoc.use_original_data,
      originalLineData: userDoc.original_line_data 
        ? {
            name: userDoc.original_line_data.name,
            email: userDoc.original_line_data.email,
            profileImage: userDoc.original_line_data.profile_image
          }
        : undefined,
      isActive: userDoc.is_active,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt
    };
  }
}