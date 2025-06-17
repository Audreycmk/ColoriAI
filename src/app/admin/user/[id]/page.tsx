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
    <div className="p-6 bg-[#FCF2DF] min-h-screen">
      <button onClick={() => router.back()} className="text-sm underline mb-4 text-[#3c3334]">
        ← Back to Admin
      </button>

      <h1 className="text-2xl font-bold mb-6">User Reports</h1>

      {loading ? (
        <p className="text-gray-500">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500">No reports found for this user.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div key={report._id} className="bg-white rounded-lg shadow p-4">
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
  );
}
