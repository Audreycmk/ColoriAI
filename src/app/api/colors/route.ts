import { connectToDatabase } from "@/lib/mongodb";
import Color from "@/models/Color";
import { NextResponse } from "next/server";

// Define the expected shape of the request body for POST
interface ColorData {
  name: string;
  hexCode: string;
}

export async function GET() {
  await connectToDatabase();
  const colors = await Color.find();
  return NextResponse.json(colors);
}

export async function POST(request: Request) {
  await connectToDatabase();

  // Parse the request body to a specific shape (ColorData)
  const data: ColorData = await request.json();

  // Create a new color document and save it to the database
  const newColor = new Color(data);
  const savedColor = await newColor.save();

  // Return the saved color with a status of 201 (Created)
  return NextResponse.json(savedColor, { status: 201 });
}
