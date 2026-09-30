//src/app/api/generate-and-upload-image/route.ts
import { NextResponse } from 'next/server';
import cloudinary from 'cloudinary';
// import OpenAI from 'openai';

// Initialize OpenAI
// if (!process.env.OPENAI_API_KEY) {
  //   console.error('❌ Missing OpenAI API key');
  //   throw new Error('Missing OpenAI configuration');
  // }
  
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  export async function POST(req: Request) {
    try {
      // Initialize Cloudflare configuration
      const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
      if (!cloudflareAccountId || !cloudflareApiToken) {
        const missingVariables = [
          !cloudflareAccountId && 'CLOUDFLARE_ACCOUNT_ID',
          !cloudflareApiToken && 'CLOUDFLARE_API_TOKEN',
        ].filter(Boolean);
        console.error('❌ Missing Cloudflare environment variables:', missingVariables.join(', '));
        return NextResponse.json({ error: 'Missing Cloudflare environment variables' }, { status: 500 });
      }
      
      // Initialize Cloudinary configuration
      const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
      const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
        console.error('❌ Missing Cloudinary environment variables');
        return NextResponse.json({ error: 'Missing Cloudinary environment variables' }, { status: 500 });
      }
      
      cloudinary.v2.config({
        cloud_name: cloudinaryCloudName,
        api_key: cloudinaryApiKey,
        api_secret: cloudinaryApiSecret,
      });
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    if (
      typeof requestBody !== 'object' ||
      requestBody === null ||
      !('imagePrompt' in requestBody) ||
      typeof requestBody.imagePrompt !== 'string'
    ) {
      return NextResponse.json({ error: 'A valid imagePrompt is required' }, { status: 400 });
    }

    const imagePrompt = requestBody.imagePrompt;

    if (imagePrompt.trim().length < 10) {
      console.warn('⚠️ Invalid or short image prompt');
      return NextResponse.json(
        { error: 'Image prompt is missing or too short' },
        { status: 400 }
      );
    }

    console.log('🎨 Generating image with prompt:', imagePrompt);

    const apparelOnlyPrompt = [
      'Create an apparel-only fashion product photograph in a clean, directly overhead flat lay on a plain white background.',
      'Show the clothing and listed fashion items laid flat and unworn, neatly spaced, fully visible, and not overlapping.',
      'There must be absolutely no person, girl, woman, model, mannequin, body, body part, face, hand, leg, silhouette, or reflection in the image.',
      'Show only the five listed wardrobe items; do not add props, extra accessories, duplicates, text, or logos.',
      `Wardrobe description: ${imagePrompt}`,
    ].join(' ');

    // const response = await openai.images.generate({
    //   model: "dall-e-3",
    //   prompt: imagePrompt,
    //   n: 1,
    //   size: "1024x1024",
    // });

    // Using Cloudflare Woker AI
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudflareApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        prompt: apparelOnlyPrompt,
        steps: 4,
      })
    });
    
    
    // if (!response.data || response.data.length === 0) {
    //   throw new Error('No image generated');
    // }

    if (!response.ok) {
      const errorDetails = await response.text().catch(() => '');
      console.error('❌ Cloudflare image generation failed:', response.status, errorDetails.slice(0, 1000));
      return NextResponse.json({ error: 'Image generation provider failed' }, { status: 502 });
    }

    // const imageUrl = response.data[0].url;
    // if (!imageUrl) {
    //   throw new Error('No image URL in response');
    // }

    // console.log('🖼️ DALL-E generated image URL:', imageUrl);

    let data: { success?: boolean; errors?: unknown; result?: { image?: unknown } };
    try {
      data = await response.json();
    } catch {
      console.error('❌ Cloudflare returned an invalid JSON response');
      return NextResponse.json({ error: 'Image generation provider returned an invalid response' }, { status: 502 });
    }

    if (data.success && typeof data.result?.image === 'string' && data.result.image) {
      const imageUrl = `data:image/png;base64,${data.result.image}`;
      console.log('🖼️ Flux-1 schnell generated image URL:', imageUrl);
      // Upload to Cloudinary using the URL directly
      const uploadResult = await cloudinary.v2.uploader.upload(imageUrl, {
        folder: 'colori-outfits',
        resource_type: 'image',
      });
  
      console.log('✅ Image uploaded to Cloudinary:', uploadResult.secure_url);
  
      return NextResponse.json({ imageUrl: uploadResult.secure_url });
    } else {
      console.error("錯誤:", data.errors);
      return NextResponse.json({ error: 'Image generation provider failed' }, { status: 502 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in generate-and-upload-image:', errorMessage);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
} 