import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    // Fetch the target user's data
    const targetUserResponse = await fetch(`https://api.clerk.dev/v1/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!targetUserResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch target user data' }, { status: 404 });
    }

    const targetUserData = await targetUserResponse.json();
    return NextResponse.json(targetUserData);
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if the current user is an admin
    const adminCheckResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!adminCheckResponse.ok) {
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 403 });
    }

    const adminUser = await adminCheckResponse.json();
    const isAdmin = adminUser.public_metadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Prevent admin from deleting themselves
    if (userId === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete the user using Clerk API
    const deleteResponse = await fetch(`https://api.clerk.dev/v1/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.error('Clerk API error:', errorData);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    console.log(`✅ User ${id} deleted by admin ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 