import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    const hashedPassword = await bcrypt.hash(password, 10);

    await connectDB();
    await User.create({ name, email, password: hashedPassword });

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });

  } catch (err) {
    console.error("Error during registration:", err);
    return NextResponse.json({ message: "An error occured while registrating the user" }, { status: 500 });
  }
}