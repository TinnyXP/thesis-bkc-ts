// src/app/api/user/login-history/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import LoginHistory from "@/models/loginHistory";
import UserModel from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * ตรวจสอบว่า id เป็น LINE ID หรือไม่
 */
function isLineUserId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('U');
}

// กำหนดให้ API นี้เป็น dynamic function เพื่อใช้ headers ได้
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่ได้รับอนุญาต" 
      }, { status: 401 });
    }
    
    // เชื่อมต่อฐานข้อมูล
    await connectDB();
    
    // หาข้อมูลผู้ใช้จากฐานข้อมูล - ตรวจสอบตาม ID
    let user = null;
    if (session.user.id === 'new-user') {
      return NextResponse.json({ 
        success: true, 
        message: "ผู้ใช้ยังไม่ได้ลงทะเบียนอย่างสมบูรณ์",
        history: []
      });
    } else if (isLineUserId(session.user.id)) {
      // ถ้าเป็น LINE ID ให้ค้นหาด้วย provider_id แทน
      user = await UserModel.findOne({ 
        provider: 'line',
        provider_id: session.user.id
      });
    } else if (mongoose.Types.ObjectId.isValid(session.user.id)) {
      // ถ้าเป็น ObjectId ปกติ
      user = await UserModel.findById(session.user.id);
    } else {
      // กรณีอื่นๆ ที่ไม่รองรับ
      return NextResponse.json({ 
        success: false, 
        message: "รูปแบบ ID ไม่ถูกต้อง",
        history: []
      });
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบข้อมูลผู้ใช้",
        history: []
      });
    }

    // รับค่า query parameters จาก URL
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const groupByIp = searchParams.get("groupByIp") === "true";
    
    // คำนวณ skip สำหรับการ pagination
    const skip = (page - 1) * limit;

    // ดึงข้อมูล IP ของเซสชันปัจจุบัน
    const headersList = request.headers;
    const currentIp = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      '127.0.0.1';

    // ถ้าต้องการจัดกลุ่มตาม IP
    if (groupByIp) {
      // วิธีที่ 1: ใช้ MongoDB Aggregation
      const pipeline = [
        // เลือกเฉพาะเรคอร์ดของผู้ใช้นี้และการเข้าสู่ระบบที่สำเร็จ
        { 
          $match: { 
            user_id: user._id,
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
                      { $eq: ["$ip_address", currentIp] },
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
                  { $eq: ["$ip_address", currentIp] },
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
            user_id: user._id,
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

      return NextResponse.json({ 
        success: true, 
        groupedHistory: loginGroups,
        currentIp: currentIp,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // ถ้าไม่จัดกลุ่ม ดึงข้อมูลแบบปกติ
      const loginHistory = await LoginHistory.find({ 
        user_id: user._id,
        login_status: "success" 
      })
      .sort({ login_time: -1 }) 
      .skip(skip)
      .limit(limit);

      // นับจำนวนทั้งหมด
      const total = await LoginHistory.countDocuments({ 
        user_id: user._id,
        login_status: "success"
      });

      // เพิ่มข้อมูลว่าเป็น IP ปัจจุบันหรือไม่
      const enhancedHistory = loginHistory.map(record => {
        const isCurrentIp = record.ip_address === currentIp;
        return {
          ...record.toObject(),
          is_current_ip: isCurrentIp
        };
      });

      return NextResponse.json({ 
        success: true, 
        history: enhancedHistory,
        currentIp: currentIp,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error("Error fetching login history:", error);
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการเข้าสู่ระบบ",
      error: error instanceof Error ? error.message : String(error),
      history: []
    }, { status: 500 });
  }
}