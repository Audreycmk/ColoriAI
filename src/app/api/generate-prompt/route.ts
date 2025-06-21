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

    // 🖼️ Step 2: Image generation logic
    // Extract imagePrompt from the Gemini result
    const promptMatch = result.match(/\*\*Image Prompt\*\*([\s\S]*?)```?/);
    const imagePrompt = promptMatch ? promptMatch[1].trim() : null;

    if (!imagePrompt || imagePrompt.length < 10) {
      console.warn('⚠️ No valid image prompt found in Gemini result.');
      return NextResponse.json({
        result,
        error: 'Image prompt missing or too short',
      });
    }

    // 🔁 Call the image generation route directly
    const imageGenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-and-upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePrompt }),
    });

    const imageData = await imageGenResponse.json();

    if (!imageData?.imageUrl) {
      console.warn('⚠️ Image generation failed.');
      return NextResponse.json({
        result,
        error: 'Image generation failed',
      });
    }

    // ✅ Return full response
    return NextResponse.json({
      result,
      outfitImage: imageData.imageUrl,
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

