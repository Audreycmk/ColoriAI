import { NextResponse } from 'next/server';
import { analyzeFace } from '@/lib/gemini';

export async function POST(req: Request) {
  const { imageBase64, age, style } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  try {
    // 🧠 Step 1: Gemini analysis
    const result = await analyzeFace(imageBase64, age, style);

    const hasSeasonalData = result.match(/\*\*Seasonal Color Type:\*\*/i);
    if (!hasSeasonalData) {
      throw new Error(`Missing required color analysis sections. Gemini result: ${result}`);
    }

    // ✅ Return the analysis result only
    // Image generation will be handled separately in the loading page
    return NextResponse.json({
      result,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ Gemini error:', err.message);
    } else {
      console.error('❌ Gemini error:', err);
    }
    return NextResponse.json({ error: 'Gemini failed to analyze image' }, { status: 500 });
  }
}

