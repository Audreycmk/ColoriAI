import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';
import { auth } from '@clerk/nextjs/server';

export async function GET(_: Request, { params }: { params: { userId: string } }) {
  try {
    await connectToDatabase();

    const { userId: adminId } = await auth();
    
    if (!adminId) {
      console.log('❌ Admin reports API - No admin ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin user from Clerk API to check admin status
    const response = await fetch(`https://api.clerk.dev/v1/users/${adminId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ Admin reports API - Failed to fetch admin user from Clerk');
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 403 });
    }

    const user = await response.json();
    const isAdmin = user.public_metadata?.role === 'admin';

    if (!isAdmin) {
      console.log('❌ Admin reports API - User is not admin');
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    console.log(`✅ Admin reports API - Fetching reports for user ${params.userId}`);
    const reports = await Report.find({ userId: params.userId }).sort({ createdAt: -1 });
    console.log(`📊 Admin reports API - Found ${reports.length} reports for user ${params.userId}`);
    
    return NextResponse.json(reports);
  } catch (err) {
    console.error('❌ Error in admin reports API:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
