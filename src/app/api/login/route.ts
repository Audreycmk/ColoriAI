import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Placeholder: Replace this with your actual authentication logic
  if (email === 'admin@example.com' && password === 'adminpassword') {
    return NextResponse.json({ role: 'admin' });  // Admin role
  }

  if (email === 'user@example.com' && password === 'userpassword') {
    return NextResponse.json({ role: 'user' });  // Regular user role
  }

  // If authentication fails
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
