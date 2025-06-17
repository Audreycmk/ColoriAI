import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  last_sign_in_at: number | null;
  public_metadata: { role?: string };
  username: string | null;
  image_url: string | null;
}

export async function GET() {
  try {
    console.log('Starting GET /api/admin/users');
    const { userId } = await auth();
    
    if (!userId) {
      console.log('No userId found in auth()');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Current userId:', userId);
    console.log('CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);

    // Get current user from Clerk API
    const userResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Failed to verify admin status:', errorText);
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 403 });
    }

    const currentUser = await userResponse.json();
    console.log('Current user data:', JSON.stringify(currentUser, null, 2));
    
    if (currentUser.public_metadata?.role !== 'admin') {
      console.log('User is not admin. Metadata:', currentUser.public_metadata);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all users from Clerk API
    console.log('Fetching all users from Clerk API...');
    const usersResponse = await fetch('https://api.clerk.dev/v1/users?limit=100', {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('Failed to fetch users:', errorText);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const response = await usersResponse.json();
    console.log('Raw users response:', JSON.stringify(response, null, 2));
    
    // The response should be an array of users directly
    const users = Array.isArray(response) ? response : [];
    console.log('Number of users found:', users.length);
    
    if (users.length === 0) {
      console.log('No users found in the response');
      return NextResponse.json([]);
    }
    
    // Transform the data to match our UserData interface
    const transformedUsers = users.map((user: ClerkUser) => {
      const transformed = {
        id: user.id,
        email: user.email_addresses[0]?.email_address || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        imageUrl: user.image_url || '',
        createdAt: new Date(user.created_at),
        lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
        isAdmin: user.public_metadata?.role === 'admin'
      };
      console.log('Transformed user:', transformed);
      return transformed;
    });

    console.log('Final transformed users:', JSON.stringify(transformedUsers, null, 2));
    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 