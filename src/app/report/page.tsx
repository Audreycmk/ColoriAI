'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './ReportPage.module.css';
import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Navigation from '@/components/Navigation';
import { useUser } from '@clerk/nextjs';
import Cookies from 'js-cookie';

interface ColorExtraction {
  label: string;
  hex: string;
}

interface ColorPalette {
  name: string;
  hex: string;
}

export default function ReportPage() {
  const { user } = useUser();
  const [analysisData, setAnalysisData] = useState<{
    seasonType: string;
    colorExtraction: ColorExtraction[];
    colorPalette: ColorPalette[];
  } | null>(null);

  useEffect(() => {
    const reportResult = localStorage.getItem('reportResult');
    if (!reportResult) return;

    const lines = reportResult.split('\n');
    let currentSection = '';
    const data: any = {
      colorExtraction: [],
      colorPalette: [],
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.includes('**Seasonal Color Type:**')) {
        const parts = trimmedLine.split('**Seasonal Color Type:**');
        if (parts[1]) {
          data.seasonType = parts[1].trim();
        }
      } else if (trimmedLine.includes('**Color Extraction:**')) {
        currentSection = 'colorExtraction';
      } else if (trimmedLine.includes('**9-Color Seasonal Palette:**')) {
        currentSection = 'colorPalette';
      } else if (!trimmedLine.startsWith('**')) {
        if (currentSection === 'colorExtraction' && trimmedLine.includes(',')) {
          const [label, hex] = trimmedLine.split(',');
          if (label && hex && label !== 'Label' && hex !== 'HEX') {
            data.colorExtraction.push({ label: label.trim(), hex: hex.trim() });
          }
        } else if (currentSection === 'colorPalette' && trimmedLine.includes(',')) {
          const [name, hex] = trimmedLine.split(',');
          if (name && hex && name !== 'Name' && hex !== 'HEX') {
            data.colorPalette.push({ name: name.trim(), hex: hex.trim() });
          }
        }
      }
    }

    if (data.seasonType && data.colorExtraction.length && data.colorPalette.length) {
      setAnalysisData(data);

      // ✅ Auto-save if not saved yet
      const alreadySaved = localStorage.getItem('reportSaved');

      // Use outfitImage or fallback to generatedImageUrl
      let outfitImage = localStorage.getItem('outfitImage');
      const generatedImageUrl = localStorage.getItem('generatedImageUrl');
      if (!outfitImage && generatedImageUrl) {
        outfitImage = generatedImageUrl;
        localStorage.setItem('outfitImage', generatedImageUrl);
        console.log('📦 outfitImage set from generatedImageUrl');
      }

      console.log('🔍 Auto-save check:');
      console.log('✅ user:', user);
      console.log('✅ alreadySaved:', alreadySaved);
      console.log('✅ outfitImage:', outfitImage);

      if (!alreadySaved && outfitImage && user) {
        fetch('/api/save-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result: data,
            outfitImage,
          }),
        })
          .then((res) => {
            if (res.ok) {
              console.log('✅ Report auto-saved');
              localStorage.setItem('reportSaved', 'true');
            } else {
              console.warn('⚠️ Report not saved:', res.statusText);
            }
          })
          .catch((err) => {
            console.error('❌ Save error:', err);
          });
      }
    }
  }, [user]);

  if (!analysisData) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="mobile-display">
      <div className="report-pdf">
        <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10">
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className={styles.back}>&lt;</div>
            </Link>
            <Navigation />
          </div>
          <img src="/ColoriAI.png" alt="ColoriAI Logo" className={styles.logo} />
          <p className={styles.seasonalColorReport}>Seasonal Color Report</p>
        </div>

        <div className="p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] h-[calc(100vh-202px)] overflow-y-auto">
          {/* User Info */}
          <div className="mt-[20px] mb-[10px] flex justify-center gap-[50px] text-sm">
            <p>
              <span className="text-black font-[600] text-[18px] leading-none tracking-[1.44px] capitalize font-[Quicksand]">User:</span>{' '}
              <span className="text-black font-[400] text-[18px] leading-none tracking-[1.44px] capitalize font-[Quicksand]">
                {user?.username || user?.firstName || 'User'}
              </span>
            </p>
          </div>

          <div className="text-center my-6">
            <p className="text-lg font-semibold">Seasonal Color Type</p>
            <h2 className={styles.colorType}>{analysisData.seasonType.toUpperCase()}</h2>
          </div>

          {/* Color Extraction */}
          <div className="mb-10">
            <p className={styles.reportTitle}>COLOR EXTRACTION</p>
            <div className="mt-4 flex gap-[40px] justify-center">
              {analysisData.colorExtraction.map((color, index) => (
                <div key={`extraction-${color.label}-${index}`} className="text-center">
                  <div className="w-[40px] h-[40px] rounded-full mx-auto" style={{ backgroundColor: color.hex }} />
                  <div className={styles.colorHex}>{color.label}<br />{color.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <p className={styles.reportTitle}>YOUR COLOR PALETTE</p>
            <div className="grid grid-cols-3 gap-4 mt-4" style={{ maxWidth: '240px', margin: '0 auto' }}>
              {analysisData.colorPalette.map((c, index) => (
                <div key={`palette-${c.name}-${index}`} className="text-center">
                  <div className="w-[50px] h-[50px] rounded-[3px] mx-auto" style={{ backgroundColor: c.hex }}></div>
                  <div className={styles.colorHex}>{c.name}<br />{c.hex}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
