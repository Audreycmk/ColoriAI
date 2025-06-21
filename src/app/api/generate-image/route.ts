import { NextResponse } from 'next/server';
import { analyzeFace } from '@/lib/gemini';

const DEMO_IMAGE_URL =
  'https://res.cloudinary.com/dtxmgotbr/image/upload/v1750092887/colori/outfits/a1b98ghz1kjzqj2mbenq.png';

// Whether to use actual image generation or demo image
const ENABLE_IMAGE_GEN = process.env.ENABLE_IMAGE_GEN === 'true';

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
    if (!ENABLE_IMAGE_GEN) {
      console.log('🧪 Image generation disabled – using demo image');
      return NextResponse.json({
        result,
        outfitImage: DEMO_IMAGE_URL,
      });
    }

    // ✅ ENABLE_IMAGE_GEN is true — generate image with prompt
    // Extract imagePrompt from the Gemini result (you likely store it or embed it in `result`)
    const promptMatch = result.match(/\*\*Image Prompt\*\*([\s\S]*?)```?/);
    const imagePrompt = promptMatch ? promptMatch[1].trim() : null;

    if (!imagePrompt || imagePrompt.length < 10) {
      console.warn('⚠️ No valid image prompt found in Gemini result.');
      return NextResponse.json({
        result,
        outfitImage: DEMO_IMAGE_URL, // fallback
        warning: 'Image prompt missing or too short, using demo image',
      });
    }

    // 🔁 Call the image generation route directly (recommended: POST fetch to internal API)
    const imageGenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-and-upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePrompt }),
    });

    const imageData = await imageGenResponse.json();

    if (!imageData?.imageUrl) {
      console.warn('⚠️ Image generation failed, using demo image.');
      return NextResponse.json({
        result,
        outfitImage: DEMO_IMAGE_URL,
        warning: 'Image generation failed, using demo image',
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
