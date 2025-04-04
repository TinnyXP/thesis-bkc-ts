import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    
    await connectDB();
    const { email } = await request.json();
    const user = await User.findOne({ email }).select("_id");
    console.log("User found:", user);

    return NextResponse.json({ user });

  } catch (error) {
    console.error("Error during checkuser:", error);
  }
}