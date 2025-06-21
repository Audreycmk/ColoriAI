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
  isDeleted?: boolean;
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteReport = async () => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/delete-report/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        console.log('🗑️ Report deleted successfully');
        router.push('/report-history');
      } else {
        console.error('❌ Failed to delete report');
        alert('Failed to delete report. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      alert('Error deleting report. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!report) return <div className="p-6 text-center">Loading report...</div>;

  return (
    <div className="p-6 pt-[5px] bg-[#FCF2DF] min-h-screen">
      <div className="flex justify-between items-center mb-[30px] mt-[30px]">
        <button 
          onClick={() => router.back()} 
          className="ml-[10px] px-[10px] py-[5px] border-none rounded-[13px] text-center font-quicksand text-[14px] font-medium uppercase tracking-[1.1px] transition-colors cursor-pointer"
          style={{
            background: 'rgba(255, 210, 165, 0.70)',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.10)',
            color: '#827D76'
          }}
        >
          ← Back
        </button>
        
        {/* Delete Button */}
        <button
          onClick={handleDeleteReport}
          disabled={deleting}
          className="mr-[10px] px-[10px] py-[5px] border-none rounded-[13px] text-center font-quicksand text-[14px] font-medium uppercase tracking-[1.1px] transition-colors disabled:opacity-50 cursor-pointer"
          style={{
            background: 'rgb(241 171 35)',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.10)',
            color: '#ffffff'
          }}
        >
          {deleting ? 'Deleting...' : 'x Delete'}
        </button>
      </div>

      {/* Deleted indicator */}
      {report.isDeleted && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            ⚠️ This report has been deleted and is only visible to administrators.
          </p>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{report.result.seasonType}</h1>
        <p className="text-sm text-gray-500 mb-4">
          Created: {new Date(report.createdAt).toLocaleString()}
        </p>

        {report.outfitImage && (
          <img
            src={report.outfitImage}
            alt="Outfit"
            className="w-full max-w-md mb-6 rounded shadow mx-auto"
          />
        )}

        <div className="mb-8">
          <h2 className="font-semibold mb-2">Color Extraction</h2>
          <div className="flex flex-wrap gap-[80px] justify-center">
            {report.result.colorExtraction.map((c, i) => (
              <div key={`${c.label}-${i}`} className="text-center">
                <div className="w-[60px] h-[60px] rounded-full mx-auto" style={{ backgroundColor: c.hex }} />
                <p className="text-xs">{c.label}</p>
                <p className="text-xs">{c.hex}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-semibold mb-2">Color Palette</h2>
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {report.result.colorPalette.map((c, i) => (
              <div key={`${c.name}-${i}`} className="text-center">
                <div className="w-[50px] h-[50px] rounded-sm mx-auto" style={{ backgroundColor: c.hex, borderRadius: '5px' }} />
                <p className="text-xs">{c.name}</p>
                <p className="text-xs">{c.hex}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 