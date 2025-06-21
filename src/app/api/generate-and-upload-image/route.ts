//src/app/api/generate-and-upload-image/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import cloudinary from 'cloudinary';

// Configure Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary environment variables');
  throw new Error('Missing Cloudinary configuration');
}

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OpenAI API key');
  throw new Error('Missing OpenAI configuration');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imagePrompt } = await req.json();

    if (!imagePrompt || imagePrompt.length < 10) {
      console.warn('⚠️ Invalid or short prompt:', imagePrompt);
      return NextResponse.json(
        { error: 'Image prompt is missing or too short' },
        { status: 400 }
      );
    }

    console.log('🎨 Generating image with prompt:', imagePrompt);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated');
    }

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    // Upload to Cloudinary
    const uploadResponse = await fetch(imageUrl);
    const imageBuffer = await uploadResponse.arrayBuffer();

    // Convert to base64 for Cloudinary
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataURI = `data:image/png;base64,${base64Image}`;

    const formData = new FormData();
    formData.append('file', dataURI);
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'colori');

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const cloudinaryData: { secure_url: string } = await cloudinaryResponse.json();

    console.log('✅ Image uploaded to Cloudinary:', cloudinaryData.secure_url);

    return NextResponse.json({ imageUrl: cloudinaryData.secure_url });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in generate-and-upload-image:', errorMessage);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
} 