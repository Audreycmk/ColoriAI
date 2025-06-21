//src/app/report-history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const reportsPerPage = 2; // Show 2 reports per page

  useEffect(() => {
    const checkAdminAndFetchReports = async () => {
      try {
        // Check if user is admin
        const adminResponse = await fetch('/api/check-admin');
        const adminData = await adminResponse.json();
        setIsAdmin(adminData.isAdmin);

        // Get userId from URL params
        const userIdFromParams = searchParams.get('userId');
        setTargetUserId(userIdFromParams);

        console.log('📋 Fetching reports from database...');
        console.log('🔍 Is Admin:', adminData.isAdmin);
        console.log('👤 Target User ID:', userIdFromParams);

        let apiUrl = '/api/reports';
        if (userIdFromParams && adminData.isAdmin) {
          // Admin viewing specific user's reports
          apiUrl = `/api/admin/reports/${userIdFromParams}`;
          console.log('🔗 Using admin API:', apiUrl);
        }

        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await res.json();
        
        console.log('📊 Reports received:', data);
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('❌ Reports data is not an array:', data);
          setError('Invalid data format received');
          return;
        }
        
        console.log(`✅ Found ${data.length} reports`);
        setReports(data);
      } catch (err) {
        console.error('❌ Failed to fetch reports:', err);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
  
    checkAdminAndFetchReports();
  }, [searchParams]);  

  // Calculate pagination
  const totalPages = Math.ceil(reports.length / reportsPerPage);
  const startIndex = (currentPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const currentReports = reports.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of content area
    const contentArea = document.querySelector('.reports-content');
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const getPageTitle = () => {
    if (targetUserId && isAdmin) {
      return `User Reports (Admin View)`;
    }
    return 'My Reports';
  };

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
          <p className={styles.seasonalColorReport}>{getPageTitle()}</p>
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
          <p className={styles.seasonalColorReport}>{getPageTitle()}</p>
        </div>
        <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] h-[calc(100vh-202px)] overflow-y-auto">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-display">
      <div className="bg-[#FEDCB6] h-[202px] flex-1 flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10">
        <div className="w-full flex justify-between items-center">
          <Link href={isAdmin && targetUserId ? "/admin" : "/"}>
            <div className={styles.back}>&lt;</div>
          </Link>
        </div>
        <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
        <p className={styles.seasonalColorReport}>{getPageTitle()}</p>
      </div>

      <div className="reports-content p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] h-[calc(100vh-470px)] overflow-y-auto">
        {reports.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              {targetUserId && isAdmin ? 'No reports found for this user.' : 'No reports saved yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Reports Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {currentReports.map((report) => (
                <Link
                  key={report._id}
                  href={`/report-history/${report._id}${targetUserId && isAdmin ? `?userId=${targetUserId}` : ''}`}
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

            {/* Pagination - Show if there are more than 2 reports (more than 1 page) */}
            {reports.length > 2 && (
              <div className="flex flex-col items-center gap-4 pb-6">
                {/* Page Info */}
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} • Showing {reports.length} total reports
                </p>
                
                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#FEDCB6] text-[#3c3334] hover:bg-[#FEDCB6]/80'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-[#3c3334] text-white'
                            : 'bg-gray-200 text-[#3c3334] hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#FEDCB6] text-[#3c3334] hover:bg-[#FEDCB6]/80'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
