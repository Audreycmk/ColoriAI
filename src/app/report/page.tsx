'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './ReportPage.module.css';
import { useState, useEffect, useRef } from 'react';
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

interface MakeupProduct {
  brand: string;
  product: string;
  shade: string;
  hex: string;
  url?: string;
}

interface OutfitData {
  styleType: string;
  imagePrompt: string;
  generatedImage?: string;
}

interface AnalysisData {
  seasonType: string;
  colorExtraction: ColorExtraction[];
  colorPalette: ColorPalette[];
  jewelryTone: { name: string; hex: string };
  hairColors: { name: string; hex: string }[];
  makeup: {
    foundations: MakeupProduct[];
    cushion: MakeupProduct;
    lipsticks: MakeupProduct[];
    blushes: MakeupProduct[];
    eyeshadows: MakeupProduct[];
  };
  celebrities: string[];
  outfit: OutfitData;
}

export default function ReportPage() {
  const { user } = useUser();
  const reportRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [showPopup, setShowPopup] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('Casual');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showInfo = (id: string) => {
    setShowPopup(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(null);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const handleDownload = async () => {
    if (!reportRef.current) return;

    try {
      const currentPopup = showPopup;
      setShowPopup(null);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FCF2DF'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);

      while (imgHeight - position > pageHeight) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      }

      setShowPopup(currentPopup);
      pdf.save('ColoriAI_Report.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  useEffect(() => {
    setIsLoading(true);

    const reportResult = localStorage.getItem('reportResult');
    if (!reportResult) {
      setIsLoading(false);
      return;
    }

    const lines = reportResult.split('\n');
    let currentSection = '';
    const data: AnalysisData = {
      seasonType: '',
      colorExtraction: [],
      colorPalette: [],
      jewelryTone: { name: '', hex: '' },
      hairColors: [],
      makeup: {
        foundations: [],
        cushion: { brand: '', product: '', shade: '', hex: '', url: '' },
        lipsticks: [],
        blushes: [],
        eyeshadows: []
      },
      celebrities: [],
      outfit: {
        styleType: selectedStyle || 'Casual',
        imagePrompt: '',
        generatedImage: localStorage.getItem('outfitImage') || localStorage.getItem('generatedImageUrl') || '/outfit-demo.png'
      }
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
      } else if (trimmedLine.includes('**Jewelry Tone:**')) {
        const parts = trimmedLine.split('**Jewelry Tone:**')[1].split(',');
        data.jewelryTone = { name: parts[0].trim(), hex: parts[1]?.trim() || '' };
      } else if (trimmedLine.includes('**Flattering Hair Colors:**')) {
        currentSection = 'hairColors';
      } else if (trimmedLine.includes('**Foundations:**')) {
        currentSection = 'foundations';
      } else if (trimmedLine.includes('**Korean Cushion:**')) {
        currentSection = 'cushion';
      } else if (trimmedLine.includes('**Lipsticks:**')) {
        currentSection = 'lipsticks';
      } else if (trimmedLine.includes('**Blushes:**')) {
        currentSection = 'blushes';
      } else if (trimmedLine.includes('**Eyeshadow Palettes:**')) {
        currentSection = 'eyeshadows';
      } else if (trimmedLine.includes('**Similar Celebrities:**')) {
        currentSection = 'celebrities';
      } else if (trimmedLine.includes('**Image Prompt:**')) {
        data.outfit.imagePrompt = trimmedLine.split('**Image Prompt:**')[1].trim();
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
        } else if (currentSection === 'hairColors' && trimmedLine.includes(',')) {
          const [name, hex] = trimmedLine.split(',');
          if (name && hex && name !== 'Name' && hex !== 'HEX') {
            data.hairColors.push({ name: name.trim(), hex: hex.trim() });
          }
        } else if (currentSection === 'foundations' && trimmedLine.startsWith('- ')) {
          const parts = trimmedLine.replace('- ', '').split(',');
          if (parts.length >= 5) {
            data.makeup.foundations.push({
              brand: parts[0].trim(),
              product: parts[1].trim(),
              shade: parts[2].trim(),
              hex: parts[3].trim(),
              url: parts[4].trim()
            });
          }
        } else if (currentSection === 'cushion' && trimmedLine.startsWith('- ')) {
          const parts = trimmedLine.replace('- ', '').split(',');
          if (parts.length >= 5) {
            data.makeup.cushion = {
              brand: parts[0].trim(),
              product: parts[1].trim(),
              shade: parts[2].trim(),
              hex: parts[3].trim(),
              url: parts[4].trim()
            };
          }
        } else if (currentSection === 'lipsticks' && trimmedLine.startsWith('- ')) {
          const parts = trimmedLine.replace('- ', '').split(',');
          if (parts.length >= 5) {
            data.makeup.lipsticks.push({
              brand: parts[0].trim(),
              product: parts[1].trim(),
              shade: parts[2].trim(),
              hex: parts[3].trim(),
              url: parts[4].trim()
            });
          }
        } else if (currentSection === 'blushes' && trimmedLine.startsWith('- ')) {
          const parts = trimmedLine.replace('- ', '').split(',');
          if (parts.length >= 5) {
            data.makeup.blushes.push({
              brand: parts[0].trim(),
              product: parts[1].trim(),
              shade: parts[2].trim(),
              hex: parts[3].trim(),
              url: parts[4].trim()
            });
          }
        } else if (currentSection === 'eyeshadows' && trimmedLine.startsWith('- ')) {
          const parts = trimmedLine.replace('- ', '').split(',');
          if (parts.length >= 5) {
            data.makeup.eyeshadows.push({
              brand: parts[0].trim(),
              product: parts[1].trim(),
              shade: parts[2].trim(),
              hex: parts[3].trim(),
              url: parts[4].trim()
            });
          }
        } else if (currentSection === 'celebrities' && trimmedLine.startsWith('- ')) {
          data.celebrities.push(trimmedLine.replace('- ', '').trim());
        }
      }
    }

    setAnalysisData(data);
    setIsLoading(false);

    // Auto-save if not saved yet
    const alreadySaved = localStorage.getItem('reportSaved');
    const outfitImage = localStorage.getItem('outfitImage') || localStorage.getItem('generatedImageUrl');

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
            localStorage.setItem('reportSaved', 'true');
          }
        })
        .catch((err) => {
          console.error('Save error:', err);
        });
    }
  }, [user, selectedStyle]);

  if (isLoading) {
    return (
      <div className="mobile-display flex items-center justify-center min-h-screen bg-[#FCF2DF]">
        <p className="text-xl text-[#3c3334] font-semibold">Loading your report...</p>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="mobile-display flex items-center justify-center min-h-screen bg-[#FCF2DF]">
        <p className="text-xl text-[#3c3334] font-semibold">No report data found. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="mobile-display">
      <div className="report-pdf" ref={reportRef}>
        {/* Header */}
        <div className="bg-[#FEDCB6] h-[202px] flex flex-col items-center justify-start px-4 pt-6 sticky top-0 z-10">
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className={styles.back}>&lt;</div>
            </Link>
            <Navigation />
          </div>

          <Image 
            src="/ColoriAI.png" 
            alt="ColoriAI Logo" 
            width={150} 
            height={50} 
            className={styles.logo}
            priority
          />

          <p className={styles.seasonalColorReport}>
            Seasonal Color Report
          </p>
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

          {/* Color Extraction */}
          <div className="mb-8 relative">
            <div className="flex justify-center items-center gap-2 mb-2 text-center">
              <p className={styles.reportTitle}>
                COLOR EXTRACTION
              </p>
              <button
                onClick={() => showInfo('color-extraction')}
                className="p-0 mt-[3px] bg-transparent border-none outline-none cursor-pointer"
                style={{ appearance: 'none' }}
              >
                <Image src="/info.svg" alt="info" width={18} height={18} />
              </button>
            </div>

            {showPopup === 'color-extraction' && (
              <div
                ref={popupRef}
                className="absolute left-1/2 z-[999] translate-x-[-50%] -top-[50px] text-[12px] text-center"
                style={{
                  width: '250px',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #B5A99D',
                  background: '#FFFBEC',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                Colors extracted from your uploaded image.
              </div>
            )}

            <div className="mt-[10px] flex gap-[40px] items-center mb-2 justify-center">
              {analysisData.colorExtraction.map(({ label, hex }) => (
                <div key={label} className="text-center">
                  <div
                    className={"w-[40px] h-[40px] rounded-full mx-auto"}
                    style={{ backgroundColor: hex }}
                  />
                  <div className={styles.colorHex}>
                    {label}<br />{hex}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seasonal Color Type */}
          <div className="mb-8">
            <div className="flex justify-center items-center gap-2 mb-2 text-center relative">
              <p className={styles.seasonalColorLabel}>Seasonal Color Type:</p>

              <button
                onClick={() => showInfo('season-type')}
                className="p-0 mt-[10px] bg-transparent border-none outline-none cursor-pointer"
                style={{ appearance: 'none' }}
              >
                <Image src="/info.svg" alt="info" width={18} height={18} />
              </button>

              {showPopup === 'season-type' && (
                <div
                  ref={popupRef}
                  className="absolute left-1/2 z-[999] translate-x-[-50%] -top-[50px] text-[12px] text-center"
                  style={{
                    width: '250px',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #B5A99D',
                    background: '#FFFBEC',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  <strong>ColoriAI</strong> found a perfect seasonal color type for your unique skin tone.
                </div>
              )}
            </div>

            <h2 className={styles.colorType}>
              {analysisData.seasonType.toUpperCase()}
            </h2>
          </div>

          {/* Color Palette */}
          <div className="mb-8">
            <div className="flex justify-center items-center gap-2 mb-4 text-center">
              <p className={styles.reportTitle}>YOUR COLOR PALETTE</p>

              <button
                onClick={() => showInfo('color-palette')}
                className="p-0 bg-transparent border-none outline-none cursor-pointer"
                style={{ appearance: 'none' }}
              >
                <Image src="/info.svg" alt="info" width={18} height={18} />
              </button>

              {showPopup === 'color-palette' && (
                <div
                  ref={popupRef}
                  className="absolute left-1/2 translate-x-[-50%] mt-2 z-10 text-[12px] text-center"
                  style={{
                    width: '270px',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #B5A99D',
                    background: '#FFFBEC',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  <strong>ColoriAI</strong> generates a color palette <br />
                  that looks good on you, based on your Seasonal Color Type.
                </div>
              )}
            </div>

            <div className="grid grid-cols-3" style={{ width: '240px', margin: '0 auto' }}>
              {analysisData.colorPalette.map((c) => (
                <div key={c.hex} className="text-center leading-tight">
                  <div
                    className="w-[50px] h-[50px] rounded-[3px] mx-auto"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className={styles.colorHex}>
                    <div>{c.name}</div>
                    <div>{c.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jewelry Tone */}
          {analysisData.jewelryTone.name && (
            <div className="mb-8 text-center">
              <p className={styles.reportTitle}>JEWELRY TONE</p>
              <div className="flex justify-center items-center gap-4 mt-4">
                <div className="text-center">
                  <div
                    className="w-[60px] h-[60px] rounded-full mx-auto"
                    style={{ backgroundColor: analysisData.jewelryTone.hex }}
                  />
                  <div className="mt-2 font-medium">
                    {analysisData.jewelryTone.name}
                  </div>
                  <div className="text-sm">
                    {analysisData.jewelryTone.hex}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hair Colors */}
          {analysisData.hairColors.length > 0 && (
            <div className="mb-8">
              <p className={styles.reportTitle}>FLATTERING HAIR COLORS</p>
              <div className="flex justify-center gap-6 mt-4">
                {analysisData.hairColors.map((color, index) => (
                  <div key={index} className="text-center">
                    <div
                      className="w-[50px] h-[50px] rounded-full mx-auto"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="mt-2 font-medium">
                      {color.name}
                    </div>
                    <div className="text-sm">
                      {color.hex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outfit */}
          <div className="mt-[50px] mb-8 text-center">
            <p className={styles.reportTitle}>STYLE: {selectedStyle.toUpperCase()}</p>
            <Image
              src={analysisData.outfit.generatedImage || '/outfit-demo.png'}
              alt="Style Outfit"
              width={200}
              height={350}
              className="mx-auto rounded-lg mb-[50px]"
            />
            {analysisData.outfit.imagePrompt && (
              <div className="mt-4 text-sm italic">
                <p>Outfit Prompt:</p>
                <p>{analysisData.outfit.imagePrompt}</p>
              </div>
            )}
          </div>

          {/* Makeup Suggestion */}
          {(analysisData.makeup.foundations.length > 0 || 
            analysisData.makeup.cushion.brand || 
            analysisData.makeup.lipsticks.length > 0 || 
            analysisData.makeup.blushes.length > 0 || 
            analysisData.makeup.eyeshadows.length > 0) && (
            <div className="mt-[20px] mb-8">
              <p className={styles.reportTitle}>MAKEUP SUGGESTION</p>

              {/* Foundations */}
              {analysisData.makeup.foundations.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-base mb-2">Foundations</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {analysisData.makeup.foundations.map((product, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: product.hex }} />
                        <div>
                          <p className="font-medium">{product.brand} {product.product}</p>
                          <p className="text-sm text-gray-600">{product.shade} • {product.hex}</p>
                        </div>
                        {product.url && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer">
                            <Image src="/external-link.svg" alt="Buy" width={16} height={16} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Korean Cushion */}
              {analysisData.makeup.cushion.brand && (
                <div className="mb-6">
                  <h3 className="font-medium text-base mb-2">Korean Cushion</h3>
                  <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                    {analysisData.makeup.cushion.hex && (
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: analysisData.makeup.cushion.hex }} />
                    )}
                    <div>
                      <p className="font-medium">{analysisData.makeup.cushion.brand} {analysisData.makeup.cushion.product}</p>
                      <p className="text-sm text-gray-600">
                        {analysisData.makeup.cushion.shade}
                        {analysisData.makeup.cushion.hex && ` • ${analysisData.makeup.cushion.hex}`}
                      </p>
                    </div>
                    {analysisData.makeup.cushion.url && (
                      <a href={analysisData.makeup.cushion.url} target="_blank" rel="noopener noreferrer">
                        <Image src="/external-link.svg" alt="Buy" width={16} height={16} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Lipsticks */}
              {analysisData.makeup.lipsticks.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-base mb-2">Lipsticks</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {analysisData.makeup.lipsticks.map((product, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: product.hex }} />
                        <div>
                          <p className="font-medium">{product.brand} {product.product}</p>
                          <p className="text-sm text-gray-600">{product.shade} • {product.hex}</p>
                        </div>
                        {product.url && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer">
                            <Image src="/external-link.svg" alt="Buy" width={16} height={16} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blushes */}
              {analysisData.makeup.blushes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-base mb-2">Blushes</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {analysisData.makeup.blushes.map((product, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: product.hex }} />
                        <div>
                          <p className="font-medium">{product.brand} {product.product}</p>
                          <p className="text-sm text-gray-600">{product.shade} • {product.hex}</p>
                        </div>
                        {product.url && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer">
                            <Image src="/external-link.svg" alt="Buy" width={16} height={16} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eyeshadow Palettes */}
              {analysisData.makeup.eyeshadows.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-base mb-2">Eyeshadow Palettes</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {analysisData.makeup.eyeshadows.map((product, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                        {product.hex && (
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: product.hex }} />
                        )}
                        <div>
                          <p className="font-medium">{product.brand} {product.product}</p>
                          {product.shade && (
                            <p className="text-sm text-gray-600">{product.shade}</p>
                          )}
                        </div>
                        {product.url && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer">
                            <Image src="/external-link.svg" alt="Buy" width={16} height={16} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Celebrities */}
          {analysisData.celebrities.length > 0 && (
            <div className="mt-8">
              <h3 className="font-medium text-base mb-2">SIMILAR CELEBRITIES</h3>
              <div className="flex flex-col gap-4">
                {analysisData.celebrities.map((name, index) => {
                  const cleanName = name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                      <Image
                        src={`/celebrities/${cleanName}.jpg`}
                        alt={name}
                        width={60}
                        height={60}
                        className="rounded-full object-cover"
                      />
                      <div className="font-medium">{name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Download Button */}
          <div className="flex justify-center mt-[30px] mb-[50px] sticky bottom-0 bg-[#FCF2DF] py-4">
            <button
              className={styles.downloadBtn}
              onClick={handleDownload}
              style={{
                position: 'relative',
                zIndex: 20,
              }}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}