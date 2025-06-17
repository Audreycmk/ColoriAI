// src/app/api/generate-and-upload-image/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imagePrompt } = await req.json();

    // Optional: Log prompt for debugging
    console.log('⚠️ Skipping DALL·E. Returning static image. Prompt was:', imagePrompt);

    const imageUrl = 'https://res.cloudinary.com/dtxmgotbr/image/upload/v1750092887/colori/outfits/a1b98ghz1kjzqj2mbenq.png';

    return NextResponse.json({
      imageUrl,
      imagePrompt: 'Image generation is disabled. Using static placeholder.',
    });
  } catch (error: any) {
    console.error('❌ Error in placeholder image response:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to return placeholder image' },
      { status: 500 }
    );
  }
}
