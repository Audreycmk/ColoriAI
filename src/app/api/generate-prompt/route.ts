// src/app/api/generate-prompt/route.ts
import { NextResponse } from 'next/server';
import { analyzeFace } from '@/lib/gemini';

export async function POST(req: Request) {
  // --- FIX START ---
  // Destructure age and style from the request body
  const { imageBase64, age, style } = await req.json(); 
  // --- FIX END ---

  // Add the console.log here to verify reception (crucial for debugging!)
  console.log('API Route: Received payload for analyzeFace:', {
    imageBase64: imageBase64 ? 'present' : 'missing', // Don't log full base64
    age: age,
    style: style
  });

  if (!imageBase64) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  try {
    // --- FIX START ---
    // Pass age and style to the analyzeFace function
    const result = await analyzeFace(imageBase64, age, style); 
    // --- FIX END ---
    
    // Log and allow analysis even if polite disclaimers are present
    const hasSeasonalData = result.match(/\*\*Seasonal Color Type:\*\*/i);
    if (!hasSeasonalData) {
      // You might want to log the full result for debugging this error case
      console.error('Missing required color analysis sections. Full Gemini result:', result); 
      throw new Error(`Missing required color analysis sections.`);
    }

    // ✅ TEMP DISABLE DALL·E IMAGE GENERATION HERE
    // Replace real DALL·E call with a placeholder image
    const imageUrl = 'https://res.cloudinary.com/dtxmgotbr/image/upload/v1750092887/colori/outfits/a1b98ghz1kjzqj2mbenq.png';
    const imagePrompt = 'Image generation is disabled for now. This is a placeholder.';

    return NextResponse.json({ result, imageUrl, imagePrompt });

    // --- ORIGINAL IMAGE GENERATION (disabled temporarily) ---
    /*
    const imagePrompt = buildImagePromptFrom(result); // <- your custom prompt builder
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      size: '1024x1792',
      quality: 'hd',
      n: 1,
    });

    const generatedImageUrl = response.data[0].url;

    return NextResponse.json({ result, imageUrl: generatedImageUrl, imagePrompt });
    */
    // --------------------------------------------------------

  } catch (err: any) {
    // Better error logging
    console.error('❌ Gemini error during analysis:', err);
    return NextResponse.json({ error: 'Gemini failed to analyze image. Please try again.' }, { status: 500 });
  }
}
