import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an admin
    const response = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 403 });
    }

    const userData = await response.json();
    const isAdmin = userData.public_metadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // TODO: Replace this with actual database query
    // This is mock data for demonstration
    const mockReports = [
      {
        userId: '1',
        userName: 'John Doe',
        colorResult: 'Soft Autumn',
        timestamp: new Date().toISOString(),
      },
      {
        userId: '2',
        userName: 'Jane Smith',
        colorResult: 'Deep Winter',
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json(mockReports);
  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 