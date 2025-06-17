//src/app/report/[userId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

interface UserReport {
  userId: string;
  userName: string;
  colorResult: string;
  timestamp: string;
  extractedColors: {
    face: string;
    eye: string;
    hair: string;
  };
  colorPalette: Array<{
    name: string;
    hex: string;
  }>;
  outfitImage?: string;
  makeupSuggestions: Array<{
    name: string;
    shade: string;
    link: string;
    image: string;
  }>;
  celebrityReferences: Array<{
    name: string;
    image: string;
  }>;
}

export default function UserReportPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [report, setReport] = useState<UserReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push('/login');
        return;
      }

      try {
        // Check if user is admin
        const response = await fetch('/api/check-admin');
        const data = await response.json();

        if (!data.isAdmin) {
          router.push('/');
          return;
        }

        setIsAdmin(true);
        // Fetch user report data
        const reportResponse = await fetch(`/api/admin/reports/${params.userId}`);
        if (!reportResponse.ok) {
          throw new Error('Failed to fetch report');
        }
        const reportData = await reportResponse.json();
        setReport(reportData);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isLoaded, isSignedIn, router, params.userId]);

  if (loading) {
    router.push('/loading');
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  if (error || !report) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Report not found'}</p>
          <Link href="/admin">
            <button className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5DC]">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Report</h1>
              <p className="mt-1 text-sm text-gray-500">
                Color analysis report for {report.userName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Color Result */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Color Analysis Result</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-gray-900">{report.colorResult}</p>
              <p className="text-sm text-gray-500 mt-1">
                Analyzed on {new Date(report.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Extracted Colors */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Extracted Colors</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(report.extractedColors).map(([type, color]) => (
                <div key={type} className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-sm font-medium text-gray-900 capitalize">{type}</p>
                  <p className="text-xs text-gray-500">{color}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Color Palette</h2>
            <div className="grid grid-cols-3 gap-4">
              {report.colorPalette.map((color) => (
                <div key={color.hex} className="text-center">
                  <div
                    className="w-16 h-16 rounded-lg mx-auto mb-2"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-sm font-medium text-gray-900">{color.name}</p>
                  <p className="text-xs text-gray-500">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Outfit Image */}
          {report.outfitImage && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Style Outfit</h2>
              <div className="relative w-64 h-96 mx-auto">
                <Image
                  src={report.outfitImage}
                  alt="Style Outfit"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          )}

          {/* Makeup Suggestions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Makeup Suggestions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.makeupSuggestions.map((item) => (
                <div key={item.name} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                  <div className="relative w-20 h-20">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Shade: {item.shade}</p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      View Product
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Celebrity References */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Celebrity References</h2>
            <div className="grid grid-cols-2 gap-8">
              {report.celebrityReferences.map((celebrity) => (
                <div key={celebrity.name} className="text-center">
                  <div className="relative w-32 h-40 mx-auto mb-2">
                    <Image
                      src={celebrity.image}
                      alt={celebrity.name}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{celebrity.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 