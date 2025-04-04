// src/app/api/auth/checkUser/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email } = await request.json();
    const user = await User.findOne({ email }).select("_id");
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error during checkuser:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}