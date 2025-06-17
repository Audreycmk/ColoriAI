import { NextResponse } from 'next/server';
import Report from '@/models/Report';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  const report = await Report.findById(params.id);

  if (!report || report.userId !== userId) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await Report.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
} 