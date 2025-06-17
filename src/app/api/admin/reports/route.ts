import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the current user is an admin
    const response = await fetch(`${process.env.NEXT_PUBLIC_CLERK_API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();
    const isAdmin = userData.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
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
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 