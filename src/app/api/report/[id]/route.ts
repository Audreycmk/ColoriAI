import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user is admin
    const response = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let isAdmin = false;
    if (response.ok) {
      const userData = await response.json();
      isAdmin = userData.public_metadata?.role === 'admin';
    }

    const report = await Report.findById(params.id);
    if (!report || report.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // For regular users, don't show deleted reports
    // For admins, show all reports including deleted ones
    if (!isAdmin && report.isDeleted) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 