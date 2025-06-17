// src/app/api/check-admin/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // Get user from Clerk API
    const response = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    const user = await response.json();
    const isAdmin = user.public_metadata?.role === 'admin';
    
    return NextResponse.json({ 
      isAdmin,
      firstName: user.first_name,
      lastName: user.last_name
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
} 