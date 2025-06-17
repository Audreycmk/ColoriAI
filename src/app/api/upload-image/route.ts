// src/app/api/upload-image/route.ts
import { NextResponse } from 'next/server';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        { folder: 'colori/selfies' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });

    // @ts-ignore
    return NextResponse.json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error('❌ Cloudinary Upload Error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}