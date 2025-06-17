// src/app/api/save-report/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const { userId } = await auth(); // ✅ from Clerk (server-side)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { result, outfitImage } = await req.json();
    console.log('📥 Saving report for userId:', userId);

    const newReport = await Report.create({
      userId, // ✅ ensure this is saved
      result,
      outfitImage,
      createdAt: new Date(),
    });

    return NextResponse.json(newReport);
  } catch (error) {
    console.error('❌ Error saving report:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
