// // src/app/api/reports/route.ts
// import { auth } from '@clerk/nextjs/server';
// import { NextResponse } from 'next/server';
// import { connectToDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

// interface Report {
//   _id: ObjectId;
//   userId: string;
//   imageUrl: string;
//   colorType: string;
//   colorPalette: string[];
//   createdAt: string;
// }

// export async function GET() {
//   try {
//     const { userId } = await auth();
    
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Get user from Clerk API
//     const userResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
//       headers: {
//         'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!userResponse.ok) {
//       return NextResponse.json({ error: 'Failed to verify user' }, { status: 403 });
//     }

//     const user = await userResponse.json();
//     const isAdmin = user.public_metadata?.role === 'admin';

//     // Connect to MongoDB
//     const db = await connectToDatabase();
//     let reports: Report[];

//     if (isAdmin) {
//       // If admin, get all reports
//       reports = await db.collection('reports').find({}).toArray() as Report[];
//     } else {
//       // If regular user, get only their reports
//       reports = await db.collection('reports').find({ userId }).toArray() as Report[];
//     }

//     return NextResponse.json(reports);
//   } catch (error) {
//     console.error('Error fetching reports:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const { userId } = await auth();
    
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await request.json();
//     const { imageUrl, colorType, colorPalette } = body;

//     if (!imageUrl || !colorType || !colorPalette) {
//       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//     }

//     // Connect to MongoDB
//     const db = await connectToDatabase();
    
//     // Create new report
//     const report = {
//       userId,
//       imageUrl,
//       colorType,
//       colorPalette,
//       createdAt: new Date().toISOString(),
//     };

//     const result = await db.collection('reports').insertOne(report);

//     return NextResponse.json({ 
//       _id: result.insertedId,
//       ...report 
//     });
//   } catch (error) {
//     console.error('Error creating report:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// src/app/api/reports/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET() {
  try {
    await connectToDatabase();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    
    // Ensure we always return an array
    if (!Array.isArray(reports)) {
      console.error('❌ Reports query did not return an array:', reports);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(reports);
  } catch (err) {
    console.error('❌ Error fetching reports:', err);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
