import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';
import { auth } from '@clerk/nextjs/server';

export async function GET(_: Request, { params }: { params: { userId: string } }) {
  try {
    await connectToDatabase();

    const { userId: adminId, sessionClaims } = await auth();
    const isAdmin = (sessionClaims?.metadata as any)?.isAdmin;

    if (!adminId || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await Report.find({ userId: params.userId }).sort({ createdAt: -1 });
    return NextResponse.json(reports);
  } catch (err) {
    console.error('❌ Error in admin reports API:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
