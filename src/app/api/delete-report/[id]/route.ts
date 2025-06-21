import { NextResponse } from 'next/server';
import Report from '@/models/Report';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // Await params for Next.js 15
    const report = await Report.findById(id);
    if (!report || report.userId !== userId) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    console.log(`🗑️ Before soft delete - Report ${id}: isDeleted=${report.isDeleted}, userId=${report.userId}`);

    // Use direct MongoDB update to ensure the field is set
    const updateResult = await Report.updateOne(
      { _id: id },
      { $set: { isDeleted: true } },
      { upsert: false }
    );
    
    console.log(`🗑️ Update result:`, updateResult);
    
    if (updateResult.modifiedCount === 0) {
      console.error(`❌ No document was modified for report ${id}`);
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }
    
    // Verify the update worked by fetching the report again
    const verifyReport = await Report.findById(id);
    console.log(`🗑️ Verification - Report ${id}: isDeleted=${verifyReport?.isDeleted}`);
    
    if (!verifyReport || verifyReport.isDeleted !== true) {
      console.error(`❌ Failed to soft delete report ${id}`);
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }
    
    console.log(`🗑️ Report ${id} soft deleted by user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error soft deleting report:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 