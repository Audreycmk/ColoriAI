'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ColorExtraction {
  label: string;
  hex: string;
}

interface ColorPalette {
  name: string;
  hex: string;
}

interface Report {
  _id: string;
  outfitImage: string;
  createdAt: string;
  result: {
    seasonType: string;
    colorExtraction: ColorExtraction[];
    colorPalette: ColorPalette[];
  };
}

export default function AdminUserReportPage() {
  const { id } = useParams(); // now using id from /admin/user/[id]
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`/api/admin/reports/${id}`);
        if (!res.ok) throw new Error('Failed to load reports');
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error(err);
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReports();
  }, [id, router]);

  return (
    <div className="mobile-display min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10 flex-shrink-0">
        <div className="w-full flex justify-between items-center">
          <button onClick={() => router.back()} className="text-sm underline text-[#3c3334]">
            ← Back to Admin
          </button>
        </div>
        <img src="/ColoriAI.png" alt="ColoriAI Logo" className="w-32 h-8 mt-4" />
        <p className="text-lg font-semibold text-[#3c3334] mt-2">User Reports</p>
      </div>

      {/* Content Area */}
      <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] flex-1 overflow-y-auto" style={{ paddingBottom: '50px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No reports found for this user.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reports.map((report) => (
              <div key={report._id} className="bg-white rounded-lg shadow p-4" style={{ marginBottom: '30px' }}>
                <p className="text-sm text-gray-500 mb-2">
                  Created: {new Date(report.createdAt).toLocaleString()}
                </p>
                <h2 className="text-lg font-semibold text-[#3c3334] mb-2">
                  {report.result.seasonType}
                </h2>

                {report.outfitImage && (
                  <img
                    src={report.outfitImage}
                    alt="Outfit"
                    className="w-full max-w-xs mb-4 rounded"
                  />
                )}

                <h3 className="font-semibold text-sm mb-1">Color Palette</h3>
                <div className="flex flex-wrap gap-2">
                  {report.result.colorPalette.map((color, i) => (
                    <div key={`${color.name}-${i}`} className="text-center">
                      <div
                        className="w-[30px] h-[30px] rounded-full border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <p className="text-xs">{color.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
