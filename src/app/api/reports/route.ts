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
    console.log('🔍 Reports API - User ID:', userId);
    
    if (!userId) {
      console.log('❌ Reports API - No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const response = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let isAdmin = false;
    if (response.ok) {
      const userData = await response.json();
      isAdmin = userData.public_metadata?.role === 'admin';
    }

    // For regular users, only show non-deleted reports
    // For admins, show all reports including deleted ones
    const query = isAdmin 
      ? { userId } 
      : { 
          userId, 
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        };

    console.log('🔍 User ID:', userId);
    console.log('🔍 Is Admin:', isAdmin);
    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    // First, let's get ALL reports for this user to debug
    const allReports = await Report.find({ userId }).sort({ createdAt: -1 });
    console.log(`🔍 ALL reports for user ${userId}: ${allReports.length}`);
    allReports.forEach((report, index) => {
      console.log(`🔍 ALL Report ${index + 1}: ID=${report._id}, isDeleted=${report.isDeleted}, userId=${report.userId}`);
    });

    const reports = await Report.find(query).sort({ createdAt: -1 });
    console.log(`📊 Reports API - Found ${reports.length} reports for user ${userId} (Admin: ${isAdmin})`);
    
    // Additional safety check - filter out any reports with isDeleted: true
    const filteredReports = isAdmin ? reports : reports.filter(report => report.isDeleted !== true);
    console.log(`📊 After safety filter: ${filteredReports.length} reports`);
    
    // Log each report's deletion status for debugging
    filteredReports.forEach((report, index) => {
      console.log(`📋 Report ${index + 1}: ID=${report._id}, isDeleted=${report.isDeleted}, userId=${report.userId}`);
    });

    return NextResponse.json(filteredReports);
  } catch (err) {
    console.error('❌ Error fetching reports:', err);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
