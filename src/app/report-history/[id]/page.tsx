///Users/Audrey/Desktop/Desktop/ColoriPRO/src/app/report-history/[id]/page.tsx
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

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/report/${id}`);
        if (!res.ok) {
          throw new Error('Report not found');
        }
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error(err);
        router.push('/report-history');
      }
    };

    fetchReport();
  }, [id, router]);

  if (!report) return <div className="p-6 text-center">Loading report...</div>;

  return (
    <div className="p-6 bg-[#FCF2DF] min-h-screen">
      <button onClick={() => router.back()} className="text-sm underline mb-4 text-[#3c3334]">
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-2">{report.result.seasonType}</h1>
      <p className="text-sm text-gray-500 mb-4">
        Created: {new Date(report.createdAt).toLocaleString()}
      </p>

      {report.outfitImage && (
        <img
          src={report.outfitImage}
          alt="Outfit"
          className="w-full max-w-md mb-6 rounded shadow"
        />
      )}

      <div className="mb-8">
        <h2 className="font-semibold mb-2">Color Extraction</h2>
        <div className="flex flex-wrap gap-4">
          {report.result.colorExtraction.map((c, i) => (
            <div key={`${c.label}-${i}`} className="text-center">
              <div className="w-[40px] h-[40px] rounded-full mx-auto" style={{ backgroundColor: c.hex }} />
              <p className="text-xs">{c.label}</p>
              <p className="text-xs">{c.hex}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Color Palette</h2>
        <div className="grid grid-cols-3 gap-3 max-w-xs">
          {report.result.colorPalette.map((c, i) => (
            <div key={`${c.name}-${i}`} className="text-center">
              <div className="w-[40px] h-[40px] rounded-sm mx-auto" style={{ backgroundColor: c.hex }} />
              <p className="text-xs">{c.name}</p>
              <p className="text-xs">{c.hex}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 