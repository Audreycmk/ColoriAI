//src/app/report-history/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  isDeleted?: boolean;
}

function ReportHistoryContent() {
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState<string | null>(null);
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

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    setDeletingReport(reportId);
    try {
      const res = await fetch(`/api/delete-report/${reportId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove the report from the local state
        setReports(prevReports => prevReports.filter(report => report._id !== reportId));
        console.log('🗑️ Report deleted successfully');
      } else {
        console.error('❌ Failed to delete report');
        alert('Failed to delete report. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      alert('Error deleting report. Please try again.');
    } finally {
      setDeletingReport(null);
    }
  };

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
      <div className="mobile-display h-[822px] flex flex-col">
        <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10 flex-shrink-0">
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className={styles.back}>&lt;</div>
            </Link>
          </div>
          <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
          <p className={styles.seasonalColorReport}>{getPageTitle()}</p>
        </div>
        <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] flex-1 overflow-y-auto flex items-center justify-center">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-display h-[822px] flex flex-col">
        <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10 flex-shrink-0">
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className={styles.back}>&lt;</div>
            </Link>
          </div>
          <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
          <p className={styles.seasonalColorReport}>{getPageTitle()}</p>
        </div>
        <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] flex-1 overflow-y-auto flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-display h-[822px] flex flex-col">
      <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10 flex-shrink-0">
        <div className="w-full flex justify-between items-center">
          <Link href={isAdmin && targetUserId ? "/admin" : "/"}>
            <div className={styles.back}>&lt;</div>
          </Link>
        </div>
        <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
        <p className={styles.seasonalColorReport}>{getPageTitle()}</p>
      </div>

      <div className="reports-content p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] flex-1 overflow-y-auto" style={{ paddingBottom: '50px' }}>
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
                <div key={report._id} className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4" style={{ marginBottom: '75px' }}>
                  {/* Delete Button - Only show for non-admin users or when admin is viewing their own reports */}
                  {(!isAdmin || (isAdmin && !targetUserId)) && (
                    <button
                      onClick={() => handleDeleteReport(report._id)}
                      disabled={deletingReport === report._id}
                      className="absolute top-2 px-[10px] py-[5px] border-none rounded-[13px] text-center font-quicksand text-[14px] font-medium uppercase tracking-[1.1px] transition-colors disabled:opacity-50 z-10 cursor-pointer"
                      style={{
                        right: '8px',
                        marginTop: '60px',
                        background: 'rgb(241 171 35)',
                        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.10)',
                        color: '#ffffff'
                      }}
                      title="Delete Report"
                    >
                      {deletingReport === report._id ? '...' : 'x Delete'}
                    </button>
                  )}

                  {/* Deleted indicator for admin view */}
                  {isAdmin && report.isDeleted && (
                    <div className="absolute top-2 left-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">
                      DELETED
                    </div>
                  )}

                  <Link
                    href={`/report-history/${report._id}${targetUserId && isAdmin ? `?userId=${targetUserId}` : ''}`}
                    className="block"
                    style={{ textDecoration: 'none', color: 'black' }}
                  >
                    {/* Date */}
                    <p className="text-xs text-gray-400 mb-1" style={{ marginLeft: '10px', marginBottom: '-8px' }}>
                      {new Date(report.createdAt).toLocaleDateString()} • {new Date(report.createdAt).toLocaleTimeString()}
                    </p>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-[#3c3334] mb-2" style={{ marginLeft: '10px' }}>
                      {report.result.seasonType || 'Unknown Season Type'}
                    </h2>

                     {/* Outfit Image */}
                    {report.outfitImage && (
                      <img
                        src={report.outfitImage}
                        alt="Outfit Preview"
                        className="w-[240px] h-[80px] rounded mb-3 object-cover"
                        style={{ transform: 'translateX(40%)', aspectRatio: '3/1' }}
                      />
                    )}
                  
                    {/* Color Palette */}
                    <div className="grid grid-cols-3 gap-1" style={{ marginLeft: '10px', marginTop: '10px', gap: '3px' }}>
                      {report.result.colorPalette.slice(0, 6).map((color, i) => (
                        <div key={`${color.name}-${i}`} className="flex flex-col items-center text-center text-xs">
                          <div
                            className="w-[30px] h-[30px] rounded-full"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="mt-1">{color.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* View Button */}
                    <div className="mt-4 text-right" style={{ marginTop: '20px' }}>
                      <span className="text-sm text-blue-600 underline">View Full Report →</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination - Show if there are more than 2 reports (more than 1 page) */}
            {reports.length > 2 && (
              <div className="flex flex-col items-center gap-4 pb-6" style={{ marginBottom: '50px' }}>
                {/* Page Info */}
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} • Showing {reports.length} total reports
                </p>
                
                {/* Pagination Controls */}
                <div className="flex items-center gap-2" style={{ gap: '3px' }}>
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="px-[10px] py-[7px] rounded-full text-sm font-medium transition-colors cursor-pointer"
                    style={{
                      background: 'rgba(224, 175, 123, 0.30)',
                      color: '#000000',
                      border: 'none',
                      margin: '6px'
                    }}
                  >
                    &lt;
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1" style={{ gap: '3px' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-[30px] h-[30px] text-sm font-medium transition-colors cursor-pointer`}
                        style={{
                          background: page === currentPage 
                            ? 'rgba(224, 175, 123, 1.0)' 
                            : 'rgba(224, 175, 123, 0.50)',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '8px',
                        }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-[10px] py-[7px] rounded-full text-sm font-medium transition-colors cursor-pointer"
                    style={{
                      background: 'rgba(224, 175, 123, 0.30)',
                      color: '#000000',
                      border: 'none',
                      margin: '6px'
                    }}
                  >
                    &gt;
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

export default function ReportHistoryPage() {
  return (
    <Suspense fallback={
      <div className="mobile-display h-[822px] flex flex-col">
        <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10 flex-shrink-0">
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className={styles.back}>&lt;</div>
            </Link>
          </div>
          <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
          <p className={styles.seasonalColorReport}>My Reports</p>
        </div>
        <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] flex-1 overflow-y-auto flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ReportHistoryContent />
    </Suspense>
  );
}
