import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const report = await Report.findById(params.id);
    if (!report || report.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 