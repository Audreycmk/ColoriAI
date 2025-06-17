import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Fetch the target user's data
    const targetUserResponse = await fetch(`${process.env.NEXT_PUBLIC_CLERK_API_URL}/users/${params.id}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!targetUserResponse.ok) {
      throw new Error('Failed to fetch target user data');
    }

    const targetUserData = await targetUserResponse.json();
    return NextResponse.json(targetUserData);
  } catch (error) {
    console.error('Error in user API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Delete the target user
    const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_CLERK_API_URL}/users/${params.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete user');
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in user API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 