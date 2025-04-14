// src/lib/repositories/loginHistoryRepository.ts
import { connectDB } from "@/lib/mongodb";
import LoginHistory from "@/models/loginHistory";
import { LoginHistoryDocument, LoginHistoryItem } from "@/lib/auth/types";
import mongoose from "mongoose";

/**
 * Repository สำหรับจัดการประวัติการเข้าสู่ระบบ
 */
export class LoginHistoryRepository {
  /**
   * บันทึกประวัติการเข้าสู่ระบบ
   * @param userId ID ของผู้ใช้
   * @param data ข้อมูลการเข้าสู่ระบบ
   * @returns ข้อมูลประวัติการเข้าสู่ระบบที่บันทึกแล้ว
   */
  async saveLoginHistory(
    userId: string,
    data: {
      ipAddress: string;
      userAgent: string;
      status: 'success' | 'failed';
      deviceInfo?: string;
      location?: string;
    }
  ): Promise<LoginHistoryDocument> {
    await connectDB();
    
    const sessionId = new mongoose.Types.ObjectId().toString();
    
    console.log(`LoginHistoryRepository: Saving login history for user: ${userId}, IP: ${data.ipAddress}`);
    
    const loginHistory = await LoginHistory.create({
      user_id: new mongoose.Types.ObjectId(userId),
      session_id: sessionId,
      login_time: new Date(),
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      login_status: data.status,
      device_info: data.deviceInfo,
      location: data.location,
      is_current_session: true
    });
    
    return loginHistory;
  }
  
  /**
   * ดึงประวัติการเข้าสู่ระบบของผู้ใช้
   * @param userId ID ของผู้ใช้
   * @param options ตัวเลือกในการดึงข้อมูล
   * @returns ประวัติการเข้าสู่ระบบและข้อมูลการแบ่งหน้า
   */
  async getLoginHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      groupByIp?: boolean;
      currentIp?: string;
    } = {}
  ): Promise<{
    history: LoginHistoryItem[] | any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    await connectDB();
    
    const { 
      page = 1, 
      limit = 10, 
      groupByIp = false,
      currentIp
    } = options;
    
    const skip = (page - 1) * limit;
    
    console.log(`LoginHistoryRepository: Getting login history for user: ${userId}, page: ${page}, groupByIp: ${groupByIp}`);
    
    try {
      // ถ้าเลือกจัดกลุ่มตาม IP
      if (groupByIp) {
        // ใช้ MongoDB Aggregation Pipeline
        const pipeline = [
          // เลือกเฉพาะเรคอร์ดของผู้ใช้นี้และการเข้าสู่ระบบที่สำเร็จ
          { 
            $match: { 
              user_id: new mongoose.Types.ObjectId(userId),
              login_status: "success" 
            } 
          },
          // จัดกลุ่มตาม IP
          {
            $group: {
              _id: "$ip_address",
              sessions: {
                $push: {
                  _id: "$_id",
                  session_id: "$session_id",
                  login_time: "$login_time",
                  user_agent: "$user_agent",
                  device_info: "$device_info",
                  location: "$location",
                  session_logout_date: "$session_logout_date",
                  is_current_session: { 
                    $cond: [
                      { $and: [
                        { $eq: ["$ip_address", currentIp || ''] },
                        { $eq: ["$session_logout_date", null] }
                      ]},
                      true,
                      false
                    ]
                  }
                }
              },
              count: { $sum: 1 },
              lastLogin: { $max: "$login_time" },
              ip_address: { $first: "$ip_address" },
              is_current_ip: { 
                $max: { 
                  $cond: [
                    { $eq: ["$ip_address", currentIp || ''] },
                    1,
                    0
                  ]
                }
              }
            }
          },
          // เรียงลำดับตามว่าเป็น IP ปัจจุบันหรือไม่ และวันที่เข้าสู่ระบบล่าสุด
          { 
            $sort: { 
              "is_current_ip": -1,
              "lastLogin": -1 
            } 
          },
          // ทำ pagination
          { $skip: skip },
          { $limit: limit }
        ] as mongoose.PipelineStage[];
        
        const loginGroups = await LoginHistory.aggregate(pipeline);
        
        // นับจำนวนกลุ่ม IP ทั้งหมด
        const countPipeline = [
          { 
            $match: { 
              user_id: new mongoose.Types.ObjectId(userId),
              login_status: "success" 
            } 
          },
          {
            $group: {
              _id: "$ip_address"
            }
          },
          {
            $count: "total"
          }
        ] as mongoose.PipelineStage[];
        
        const countResult = await LoginHistory.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;
        
        return {
          history: loginGroups,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      } else {
        // ดึงข้อมูลแบบปกติ (ไม่จัดกลุ่ม)
        const loginHistoryRecords = await LoginHistory.find({
          user_id: new mongoose.Types.ObjectId(userId),
          login_status: "success"
        })
          .sort({ login_time: -1 })
          .skip(skip)
          .limit(limit);
        
        const total = await LoginHistory.countDocuments({
          user_id: new mongoose.Types.ObjectId(userId),
          login_status: "success"
        });
        
        // แปลงข้อมูลและเพิ่มข้อมูลว่าเป็น IP ปัจจุบันหรือไม่
        const mappedHistory = loginHistoryRecords.map(record => {
          const isCurrentIp = record.ip_address === currentIp;
          return this.mapToLoginHistoryItem(record, isCurrentIp);
        });
        
        return {
          history: mappedHistory,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
    } catch (error) {
      console.error("Error in getLoginHistory:", error);
      return {
        history: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }
  }
  
  /**
   * ทำเครื่องหมายออกจากระบบสำหรับ IP หรือ session ที่ระบุ
   * @param userId ID ของผู้ใช้
   * @param options ตัวเลือกในการออกจากระบบ
   * @returns ผลลัพธ์การทำเครื่องหมายออกจากระบบ
   */
  async logoutSession(
    userId: string,
    options: {
      ipAddress?: string;
      sessionId?: string;
      reason?: 'user_request' | 'timeout' | 'security_alert' | 'admin_action' | 'system';
    }
  ): Promise<{
    matched: number;
    modified: number;
  }> {
    await connectDB();
    
    const { ipAddress, sessionId, reason = 'user_request' } = options;
    
    if (!ipAddress && !sessionId) {
      throw new Error('Either ipAddress or sessionId is required');
    }
    
    console.log(`LoginHistoryRepository: Logging out session for user: ${userId}, IP: ${ipAddress}, sessionId: ${sessionId}`);
    
    // สร้างเงื่อนไขในการค้นหา
    const query: any = {
      user_id: new mongoose.Types.ObjectId(userId),
      session_logout_date: { $exists: false }
    };
    
    // เพิ่มเงื่อนไขตามที่ระบุมา
    if (ipAddress) {
      query.ip_address = ipAddress;
    }
    
    if (sessionId) {
      query.session_id = sessionId;
    }
    
    // อัพเดทเรคอร์ดที่ตรงกับเงื่อนไข
    const result = await LoginHistory.updateMany(
      query,
      {
        $set: {
          session_logout_date: new Date(),
          logout_reason: reason,
          is_current_session: false
        }
      }
    );
    
    return {
      matched: result.matchedCount,
      modified: result.modifiedCount
    };
  }
  
  /**
   * แปลงข้อมูลจาก database schema เป็น LoginHistoryItem
   * @param doc ข้อมูลประวัติการเข้าสู่ระบบจาก database
   * @param isCurrentIp เป็น IP ปัจจุบันหรือไม่
   * @returns ข้อมูลประวัติการเข้าสู่ระบบสำหรับ application
   */
  private mapToLoginHistoryItem(doc: LoginHistoryDocument, isCurrentIp = false): LoginHistoryItem {
    return {
      id: doc._id.toString(),
      sessionId: doc.session_id,
      loginTime: doc.login_time,
      ipAddress: doc.ip_address,
      userAgent: doc.user_agent,
      deviceInfo: doc.device_info,
      location: doc.location,
      logoutDate: doc.session_logout_date,
      isCurrentSession: doc.is_current_session,
      isCurrentIp,
      logoutReason: doc.logout_reason
    };
  }
}