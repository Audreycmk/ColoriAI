import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user from Clerk API
    const userResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Failed to verify user' }, { status: 403 });
    }

    const currentUser = await userResponse.json();
    if (currentUser.public_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can set other users as admin' }, { status: 403 });
    }

    // Get the target user ID from the request body
    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Update the target user's metadata
    const updateResponse = await fetch(`https://api.clerk.dev/v1/users/${targetUserId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          role: 'admin'
        }
      })
    });

    if (!updateResponse.ok) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 