//src/app/report-history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../report/ReportPage.module.css';

interface Report {
  _id: string;
  result: {
    seasonType: string;
    colorExtraction: {
      label: string;
      hex: string;
    }[];
    colorPalette: {
      name: string;
      hex: string;
    }[];
  };
  outfitImage: string;
  createdAt: string;
}

export default function ReportHistoryPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await res.json();
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('❌ Reports data is not an array:', data);
          setError('Invalid data format received');
          return;
        }
        
        setReports(data);
      } catch (err) {
        console.error('❌ Failed to fetch reports:', err);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
  
    fetchReports();
  }, []);  

  if (loading) {
    return (
      <div className="mobile-display">
        <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10">
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className={styles.back}>&lt;</div>
            </Link>
          </div>
          <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
          <p className={styles.seasonalColorReport}>My Reports</p>
        </div>
        <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] h-[calc(100vh-202px)] overflow-y-auto">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-display">
        <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10">
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className={styles.back}>&lt;</div>
            </Link>
          </div>
          <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
          <p className={styles.seasonalColorReport}>My Reports</p>
        </div>
        <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] h-[calc(100vh-202px)] overflow-y-auto">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-display">
      <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10">
        <div className="w-full flex justify-between items-center">
          <Link href="/">
            <div className={styles.back}>&lt;</div>
          </Link>
        </div>
        <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
        <p className={styles.seasonalColorReport}>My Reports</p>
      </div>

      <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] h-[calc(100vh-202px)] overflow-y-auto">
        {reports.length === 0 ? (
          <div className="flex items-center justify-center">
            <p className="text-gray-500">No reports saved yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
  {reports.map((report) => (
    <Link
      key={report._id}
      href={`/report-history/${report._id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4"
    >
      {/* Date */}
      <p className="text-xs text-gray-400 mb-2">
        {new Date(report.createdAt).toLocaleDateString()} • {new Date(report.createdAt).toLocaleTimeString()}
      </p>

      {/* Title */}
      <h2 className="text-lg font-semibold text-[#3c3334] mb-2">
        {report.result.seasonType || 'Unknown Season Type'}
      </h2>

      {/* Outfit Image */}
      {report.outfitImage && (
        <img
          src={report.outfitImage}
          alt="Outfit Preview"
          className="w-full h-48 object-cover rounded mb-3"
        />
      )}

      {/* Color Palette */}
      <div className="flex gap-2 flex-wrap">
        {report.result.colorPalette.slice(0, 6).map((color, i) => (
          <div key={`${color.name}-${i}`} className="flex flex-col items-center text-center text-xs">
            <div
              className="w-[30px] h-[30px] rounded-full border"
              style={{ backgroundColor: color.hex }}
            />
            <span className="mt-1">{color.name}</span>
          </div>
        ))}
      </div>

      {/* View Button */}
      <div className="mt-4 text-right">
        <span className="text-sm text-blue-600 underline">View Full Report →</span>
      </div>
    </Link>
  ))}
</div>

        )}
      </div>
    </div>
  );
}
