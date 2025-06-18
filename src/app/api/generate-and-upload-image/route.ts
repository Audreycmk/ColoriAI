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

    // Generate image using DALL-E
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1792',
      response_format: 'b64_json',
    });

    const imageBase64 = imageResponse?.data?.[0]?.b64_json;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      console.error('❌ Invalid image response from DALL-E:', imageResponse);
      return NextResponse.json(
        { error: 'Failed to generate a valid image' },
        { status: 500 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageBase64, 'base64');

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        { folder: 'colori/outfits' },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result);
        }
      ).end(buffer);
    });

    // @ts-ignore
    const imageUrl = uploadResult.secure_url;

    console.log('✅ Image uploaded to Cloudinary:', imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('❌ Error in generate-and-upload-image:', error?.message || error);
    if (error?.response?.data) {
      console.error('OpenAI API error details:', error.response.data);
    }
    return NextResponse.json(
      { error: 'Failed to generate and upload image: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 