'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './ReportPage.module.css';
import { useState, useEffect, useRef, useMemo } from 'react';
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

  const defaultPalette = useMemo(() => [
    { name: 'Rose Quartz', hex: '#F0D1D9' },
    { name: 'Misty Lavender', hex: '#D8E0E8' },
    { name: 'Silver', hex: '#C8D0D8' },
    { name: 'Powder Blue', hex: '#B3C6D7' },
    { name: 'Soft Rose', hex: '#E6D1D1' },
    { name: 'Pale Mauve', hex: '#D5C2D2' },
    { name: 'Dusty Rose', hex: '#BCADA9' },
    { name: 'Taupe', hex: '#A79A8D' },
    { name: 'Greyish Beige', hex: '#E0D5CB' },
  ], []);

  useEffect(() => {
    setIsLoading(true);

    const parseReport = () => {
      const reportResult = localStorage.getItem('reportResult');
      const generatedImage = localStorage.getItem('generatedOutfitImage');
      const urlParams = new URLSearchParams(window.location.search);
      const styleFromUrl = urlParams.get('style');
      let styleToUse = Cookies.get('preferredStyle');

      if (styleFromUrl) {
        styleToUse = styleFromUrl;
        Cookies.set('preferredStyle', styleFromUrl);
      } else if (!styleToUse) {
        styleToUse = 'Casual';
        Cookies.set('preferredStyle', 'Casual');
      }

      setSelectedStyle(styleToUse || 'Casual');

      if (!reportResult) {
        setIsLoading(false);
        return;
      }

      try {
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
            styleType: styleToUse || 'Casual', 
            imagePrompt: '', 
            generatedImage: generatedImage || '/outfit-demo.png' 
          }
        };

        // Split by double newlines to handle Gemini's response format better
        const sections = reportResult.split('\n\n').map(section => section.trim());

        for (const section of sections) {
          const lines = section.split('\n').map(line => line.trim());
          
          // Seasonal Color Type
          if (lines[0].includes('Seasonal Color Type:')) {
            const type = lines[0].split(':')[1].trim();
            data.seasonType = type.replace(/\*\*/g, '').trim();
          }
          
          // Color Extraction
          else if (lines[0].includes('Color Extraction')) {
            for (let i = 2; i < lines.length; i++) { // Skip header line
              if (lines[i].includes(',')) {
                const [label, hex] = lines[i].split(',');
                data.colorExtraction.push({ label: label.trim(), hex: hex.trim() });
              }
            }
          }
          
          // Color Palette
          else if (lines[0].includes('9-Color Seasonal Palette')) {
            for (let i = 2; i < lines.length; i++) { // Skip header line
              if (lines[i].includes(',')) {
                const [name, hex] = lines[i].split(',');
                data.colorPalette.push({ name: name.trim(), hex: hex.trim() });
              }
            }
          }
          
          // Jewelry Tone
          else if (lines[0].includes('Jewelry Tone:')) {
            const parts = lines[0].split(':')[1].split(',');
            data.jewelryTone = { name: parts[0].trim(), hex: parts[1]?.trim() || '' };
          }
          
          // Hair Colors
          else if (lines[0].includes('Flattering Hair Colors')) {
            for (let i = 2; i < lines.length; i++) { // Skip header line
              if (lines[i].includes(',')) {
                const [name, hex] = lines[i].split(',');
                data.hairColors.push({ name: name.trim(), hex: hex.trim() });
              }
            }
          }
          
          // Makeup Sections
          else if (lines[0].includes('Foundations:')) {
            for (let i = 2; i < lines.length; i++) { // Skip header: Brand,Product,...
              const parts = lines[i].split(',');
              if (parts.length >= 5) {
                data.makeup.foundations.push({
                  brand: parts[0].trim(),
                  product: parts[1].trim(),
                  shade: parts[2].trim(),
                  hex: parts[3].trim(),
                  url: parts[4].replace(/\[|\]|\(|\)/g, '').trim()
                });
              }
            }
          }
          else if (lines[0].includes('Korean Cushion:')) {
            // Fallback for unstructured Korean Cushion data
            data.makeup.cushion = {
              brand: 'Sulwhasoo / Hera / IOPE',
              product: 'Select based on undertone',
              shade: '#B58A6B or #C29174',
              hex: '#B58A6B',
              url: 'https://www.sulwhasoo.com'
            };
          }
          else if (lines[0].includes('Lipsticks:')) {
            for (let i = 2; i < lines.length; i++) { // Skip header: Brand,Product,...
              const parts = lines[i].split(',');
              if (parts.length >= 5) {
                data.makeup.lipsticks.push({
                  brand: parts[0].trim(),
                  product: parts[1].trim(),
                  shade: parts[2].trim(),
                  hex: parts[3].trim(),
                  url: parts[4].replace(/\[|\]|\(|\)/g, '').trim()
                });
              }
            }
          }
          else if (lines[0].includes('Blushes:')) {
            for (let i = 2; i < lines.length; i++) { // Skip header: Brand,Product,...
              const parts = lines[i].split(',');
              if (parts.length >= 5) {
                data.makeup.blushes.push({
                  brand: parts[0].trim(),
                  product: parts[1].trim(),
                  shade: parts[2].trim(),
                  hex: parts[3].trim(),
                  url: parts[4].replace(/\[|\]|\(|\)/g, '').trim()
                });
              }
            }
          }
          else if (lines[0].includes('Eyeshadow Palettes:')) {
            // Fallback for unstructured Eyeshadow Palettes data
            data.makeup.eyeshadows.push({
              brand: 'Charlotte Tilbury / Natasha Denona / Viseart',
              product: 'Warm earthy palette',
              shade: 'Browns, golds, muted reds',
              hex: '#A0522D',
              url: ''
            });
          }
          
          // Celebrities
          else if (lines[0].includes('Similar Celebrities:')) {
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].startsWith('- ')) {
                data.celebrities.push(lines[i].replace('- ', '').trim());
              }
            }
          }
          
          // Image Prompt
          else if (lines[0].includes('Image Prompt:')) {
            data.outfit.imagePrompt = lines[0].split(':')[1].trim();
          }
        }

        setAnalysisData(data);
      } catch (err) {
        console.error('Parsing failed:', err);
        // Fallback to default data
        setAnalysisData({
          seasonType: 'Soft Summer',
          colorExtraction: [
            { label: 'Face', hex: '#F2E8E2' },
            { label: 'Eye', hex: '#A7B1BC' },
            { label: 'Hair', hex: '#F2E0D9' }
          ],
          colorPalette: defaultPalette,
          jewelryTone: { name: 'Silver', hex: '#C8D0D8' },
          hairColors: [
            { name: 'Soft Blonde', hex: '#F2E0D9' },
            { name: 'Pearl Blonde', hex: '#EAE5D9' }
          ],
          makeup: {
            foundations: [
              {
                brand: 'NARS',
                product: 'Natural Radiant Longwear Foundation',
                shade: 'Mont Blanc',
                hex: '#F2E8E2',
                url: 'https://www.narscosmetics.com'
              },
              {
                brand: 'Ilia',
                product: 'Super Serum Skin Tint',
                shade: 'SF4',
                hex: '#F0E6E0',
                url: 'https://ilia.com'
              }
            ],
            cushion: {
              brand: 'Sulwhasoo',
              product: 'Perfecting Cushion',
              shade: '#21 Light Beige',
              hex: '#F2E8E2',
              url: 'https://www.sulwhasoo.com'
            },
            lipsticks: [
              {
                brand: 'NARS',
                product: 'Audacious Lipstick',
                shade: 'Anna',
                hex: '#B09FA0',
                url: 'https://www.narscosmetics.com'
              },
              {
                brand: 'Dior',
                product: 'Rouge Dior',
                shade: '#772 Rose Montaigne',
                hex: '#E2D3D2',
                url: 'https://www.dior.com'
              }
            ],
            blushes: [
              {
                brand: 'Rare Beauty',
                product: 'Soft Pinch Liquid Blush',
                shade: 'Love',
                hex: '#E9D5D3',
                url: 'https://www.rarebeauty.com'
              },
              {
                brand: 'Glossier',
                product: 'Cloud Paint',
                shade: 'Puff',
                hex: '#E2D2CF',
                url: 'https://www.glossier.com'
              }
            ],
            eyeshadows: [
              {
                brand: 'Charlotte Tilbury',
                product: 'Luxury Palette',
                shade: 'Pillow Talk',
                hex: '#E1CEC8',
                url: 'https://www.charlottetilbury.com'
              }
            ]
          },
          celebrities: ['Saoirse Ronan', 'Lily Collins'],
          outfit: {
            styleType: selectedStyle || 'Casual',
            imagePrompt: 'A flatlay of a daily outfit for a 25-year-old: a #E0D5CB knitted top, #A79A8D wide-leg trousers, #B3C6D7 canvas sneakers, a #E0D5CB tote bag, and #A79A8D cat-eye glasses.',
            generatedImage: '/outfit-demo.png'
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    parseReport();

    // Add polling for the generated image
    const checkForGeneratedImage = () => {
      const generatedImageUrl = localStorage.getItem('generatedImageUrl');
      if (generatedImageUrl) {
        setAnalysisData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            outfit: {
              ...prev.outfit,
              generatedImage: generatedImageUrl
            }
          };
        });
      }
    };

    // Check immediately and then every 2 seconds
    checkForGeneratedImage();
    const intervalId = setInterval(checkForGeneratedImage, 2000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [defaultPalette, selectedStyle]);

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
            <Link href="/upload-image">
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

          {/* Hair Colors */}
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

          {/* Outfit */}
          <div className="mt-[50px] mb-8 text-center">
            <p className={styles.reportTitle}>OUTFIT FOR YOU</p>
            {analysisData.outfit.generatedImage && analysisData.outfit.generatedImage !== '/outfit-demo.png' ? (
              <Image
                src={analysisData.outfit.generatedImage}
                alt="Style Outfit"
                width={200}
                height={350}
                className="mx-auto rounded-lg mb-[50px]"
              />
            ) : (
              <div className="w-[200px] h-[350px] mx-auto rounded-lg mb-[50px] bg-gray-100 flex items-center justify-center">
                <p className="text-gray-600 font-medium">Generating your outfit...</p>
              </div>
            )}
            {analysisData.outfit.imagePrompt && (
              <div className="mt-4 text-sm italic">
                <p>Outfit Prompt:</p>
                <p>{analysisData.outfit.imagePrompt}</p>
              </div>
            )}
          </div>

          {/* Makeup Suggestion */}
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
            {analysisData.makeup.cushion && analysisData.makeup.cushion.brand && (
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

            {/* Celebrities */}
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
          </div>

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