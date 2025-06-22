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
            data.jewelryTone = { name: parts[0].trim().replace(/\*\*/g, ''), hex: parts[1]?.trim().replace(/\*\*/g, '') || '' };
          }
          else if (lines[0].includes('**Jewelry Tone**')) {
            const parts = lines[0].split('**Jewelry Tone**')[1].split(',');
            data.jewelryTone = { name: parts[0].trim().replace(/\*\*/g, ''), hex: parts[1]?.trim().replace(/\*\*/g, '') || '' };
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
            for (let i = 2; i < lines.length; i++) { // Skip header: Brand,Product,...
              const parts = lines[i].split(',');
              if (parts.length >= 5) {
                data.makeup.cushion = {
                  brand: parts[0].trim(),
                  product: parts[1].trim(),
                  shade: parts[2].trim(),
                  hex: parts[3].trim(),
                  url: parts[4].replace(/\[|\]|\(|\)/g, '').trim()
                };
              }
            }
            // Fallback if no structured data found
            if (!data.makeup.cushion.brand) {
            data.makeup.cushion = {
              brand: 'Sulwhasoo / Hera / IOPE',
              product: 'Select based on undertone',
              shade: '#B58A6B or #C29174',
              hex: '#B58A6B',
              url: 'https://www.sulwhasoo.com'
            };
            }
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
            // Fallback if no structured data found
            if (data.makeup.lipsticks.length === 0) {
              data.makeup.lipsticks = [
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
                },
                {
                  brand: 'MAC',
                  product: 'Matte Lipstick',
                  shade: 'Velvet Teddy',
                  hex: '#B09FA0',
                  url: 'https://www.maccosmetics.com'
                },
                {
                  brand: 'Charlotte Tilbury',
                  product: 'Matte Revolution',
                  shade: 'Pillow Talk',
                  hex: '#E2D3D2',
                  url: 'https://www.charlottetilbury.com'
                }
              ];
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
            for (let i = 2; i < lines.length; i++) { // Skip header: Brand,Product,...
              const parts = lines[i].split(',');
              if (parts.length >= 5) {
                data.makeup.eyeshadows.push({
                  brand: parts[0].trim(),
                  product: parts[1].trim(),
                  shade: parts[2].trim(),
                  hex: parts[3].trim(),
                  url: parts[4].replace(/\[|\]|\(|\)/g, '').trim()
                });
              }
            }
            // Fallback if no structured data found
            if (data.makeup.eyeshadows.length === 0) {
            data.makeup.eyeshadows.push({
              brand: 'Charlotte Tilbury / Natasha Denona / Viseart',
              product: 'Warm earthy palette',
              shade: 'Browns, golds, muted reds',
              hex: '#A0522D',
                url: 'https://www.charlottetilbury.com'
            });
            }
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
            let prompt = lines[0].split(':')[1].trim();
            
            // Clean up the prompt to show only the outfit items
            // Remove common prefixes like "Flatlay of...", "A formal outfit for...", etc.
            prompt = prompt.replace(/^(flatlay of|a\s+\w+\s+outfit for|an?\s+\w+\s+outfit for)\s+/i, '');
            prompt = prompt.replace(/^.*?including\s+exactly\s+\d+\s+items?:\s*/i, '');
            prompt = prompt.replace(/^.*?with\s+\d+\s+items?:\s*/i, '');
            
            // Remove any remaining prefixes that might contain age or style info
            prompt = prompt.replace(/^.*?for\s+a\s+person\s+age\s+\d+[-\d]*\s*years?\s*old\s*:\s*/i, '');
            prompt = prompt.replace(/^.*?for\s+an?\s+\d+[-\d]*\s*year\s*old\s*:\s*/i, '');
            
            // Clean up any remaining colons and extra spaces
            prompt = prompt.replace(/^:\s*/, '').trim();
            
            data.outfit.imagePrompt = prompt;
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
              },
              {
                brand: 'MAC',
                product: 'Matte Lipstick',
                shade: 'Velvet Teddy',
                hex: '#B09FA0',
                url: 'https://www.maccosmetics.com'
              },
              {
                brand: 'Charlotte Tilbury',
                product: 'Matte Revolution',
                shade: 'Pillow Talk',
                hex: '#E2D3D2',
                url: 'https://www.charlottetilbury.com'
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
            imagePrompt: 'Daily outfit for a 25-year-old: #E0D5CB knitted top, #A79A8D wide-leg trousers, #B3C6D7 canvas sneakers,  #E0D5CB tote bag, and #A79A8D cat-eye glasses.',
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
    if (!reportRef.current || !analysisData) return;
  
    try {
      // Hide popups and wait for UI to settle
      const currentPopup = showPopup;
      setShowPopup(null);
      await new Promise(resolve => setTimeout(resolve, 300));
  
      // Create a new container for PDF with the simplified layout
      const pdfContainer = document.createElement('div');
      pdfContainer.style.width = '210mm';
      pdfContainer.style.height = '310mm';
      pdfContainer.style.fontSize = '12pt';
      pdfContainer.style.background = '#FCF2DF';
      pdfContainer.style.fontFamily = 'Quicksand, sans-serif';
      pdfContainer.style.textAlign = 'center';
      document.body.appendChild(pdfContainer);
  
      // Add header with ColoriAI logo
      const header = document.createElement('div');
      header.style.marginBottom = '2pt';
      header.innerHTML = `
        <img src="/ColoriAI.png" alt="ColoriAI Logo" style="width: 250px; height: auto; margin-bottom: 30px; margin-top: 10px;" />
        <h2 style="font-size: 24pt; font-weight: 600; margin-bottom: 16pt; color: #3c3334;"><span style="font-weight: 400;font-size: 18pt;">Your Color Type:</span> ${analysisData.seasonType}</h2>
        <p style="font-size: 10pt; color: #666; margin-bottom: 16pt;">Generated by ColoriAI • ${new Date().toLocaleDateString()}</p>
      `;
      pdfContainer.appendChild(header);
  
      // Create main content container with right offset
      const contentContainer = document.createElement('div');
      contentContainer.style.textAlign = 'center';
      contentContainer.style.display = 'flex';
      contentContainer.style.flexDirection = 'column';
      contentContainer.style.alignItems = 'center';
      contentContainer.style.justifyContent = 'center';
      pdfContainer.appendChild(contentContainer);
  
      // Add outfit image if available
      if (analysisData.outfit.generatedImage && 
          analysisData.outfit.generatedImage !== '/outfit-demo.png' && 
          analysisData.outfit.generatedImage !== 'undefined' && 
          analysisData.outfit.generatedImage !== 'null') {
        const imgContainer = document.createElement('div');
        imgContainer.style.marginBottom = '16pt';
        const img = document.createElement('img');
        img.src = analysisData.outfit.generatedImage;
        img.style.maxWidth = '60mm';
        img.style.height = 'auto';
        img.style.borderRadius = '8pt';
        img.style.boxShadow = '0 2pt 4pt rgba(0,0,0,0.1)';
        imgContainer.appendChild(img);
        contentContainer.appendChild(imgContainer);
      } else {
        // Fallback to demo image
        const imgContainer = document.createElement('div');
        imgContainer.style.marginBottom = '16pt';
        const img = document.createElement('img');
        img.src = '/outfit-demo.png';
        img.style.maxWidth = '60mm';
        img.style.height = 'auto';
        img.style.borderRadius = '8pt';
        img.style.boxShadow = '0 2pt 4pt rgba(0,0,0,0.1)';
        imgContainer.appendChild(img);
        contentContainer.appendChild(imgContainer);
      }
  
      // Add Color Extraction
      const colorExtractionSection = document.createElement('div');
      colorExtractionSection.style.marginBottom = '16pt';
      colorExtractionSection.innerHTML = `
        <h2 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Color Extraction</h2>
      `;
      
      const colorExtractionContainer = document.createElement('div');
      colorExtractionContainer.style.display = 'flex';
      colorExtractionContainer.style.justifyContent = 'center';
      colorExtractionContainer.style.gap = '8pt';
      colorExtractionContainer.style.flexWrap = 'wrap';
      
      analysisData.colorExtraction.forEach(color => {
        const colorItem = document.createElement('div');
        colorItem.style.textAlign = 'center';
        colorItem.innerHTML = `
          <div style="width: 24pt; height: 24pt; border-radius: 50%; background-color: ${color.hex}; margin: 0 auto 4pt;"></div>
          <p style="font-size: 8pt; margin: 0;">${color.label}</p>
          <p style="font-size: 8pt; margin: 0; color: #666;">${color.hex}</p>
        `;
        colorExtractionContainer.appendChild(colorItem);
      });
      
      colorExtractionSection.appendChild(colorExtractionContainer);
      contentContainer.appendChild(colorExtractionSection);
  
      // Add Color Palette
      const colorPaletteSection = document.createElement('div');
      colorPaletteSection.style.marginBottom = '16pt';
      colorPaletteSection.innerHTML = `
        <h2 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Color Palette</h2>
      `;
      
      const colorPaletteContainer = document.createElement('div');
      colorPaletteContainer.style.display = 'grid';
      colorPaletteContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
      colorPaletteContainer.style.gap = '8pt';
      colorPaletteContainer.style.maxWidth = '120mm';
      colorPaletteContainer.style.margin = '0 auto';
      
      analysisData.colorPalette.forEach(color => {
        const colorItem = document.createElement('div');
        colorItem.style.textAlign = 'center';
        colorItem.innerHTML = `
          <div style="width: 24pt; height: 24pt; border-radius: 4pt; background-color: ${color.hex}; margin: 0 auto 4pt;"></div>
          <p style="font-size: 8pt; margin: 0;">${color.name}</p>
          <p style="font-size: 8pt; margin: 0; color: #666;">${color.hex}</p>
        `;
        colorPaletteContainer.appendChild(colorItem);
      });
      
      colorPaletteSection.appendChild(colorPaletteContainer);
      contentContainer.appendChild(colorPaletteSection);
  
      // Add Jewelry Tone
      if (analysisData.jewelryTone.name) {
        const jewelrySection = document.createElement('div');
        jewelrySection.style.marginBottom = '16pt';
        jewelrySection.innerHTML = `
          <h2 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Jewelry Tone</h2>
          <div style="text-align: center;">
            <div style="width: 36pt; height: 36pt; border-radius: 50%; background-color: ${analysisData.jewelryTone.hex}; margin: 0 auto 8pt;"></div>
            <p style="font-size: 10pt; font-weight: 500; margin: 0;">${analysisData.jewelryTone.name}</p>
            <p style="font-size: 8pt; margin: 0; color: #666;">${analysisData.jewelryTone.hex}</p>
          </div>
        `;
        contentContainer.appendChild(jewelrySection);
      }
  
      // Add Hair Colors
      if (analysisData.hairColors.length > 0) {
        const hairSection = document.createElement('div');
        hairSection.style.marginBottom = '16pt';
        hairSection.innerHTML = `
          <h2 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Flattering Hair Colors</h2>
        `;
        
        const hairContainer = document.createElement('div');
        hairContainer.style.display = 'flex';
        hairContainer.style.justifyContent = 'center';
        hairContainer.style.gap = '12pt';
        
        analysisData.hairColors.forEach(color => {
          const colorItem = document.createElement('div');
          colorItem.style.textAlign = 'center';
          colorItem.innerHTML = `
            <div style="width: 30pt; height: 30pt; border-radius: 50%; background-color: ${color.hex}; margin: 0 auto 8pt;"></div>
            <p style="font-size: 10pt; font-weight: 500; margin: 0;">${color.name}</p>
            <p style="font-size: 8pt; margin: 0; color: #666;">${color.hex}</p>
          `;
          hairContainer.appendChild(colorItem);
        });
        
        hairSection.appendChild(hairContainer);
        contentContainer.appendChild(hairSection);
      }
  
      // Generate canvas with the new layout
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FCF2DF',
        width: pdfContainer.offsetWidth,
        height: pdfContainer.offsetHeight
      });
  
      // Clean up
      document.body.removeChild(pdfContainer);
  
      // Create second page for makeup suggestions
      const makeupPdfContainer = document.createElement('div');
      makeupPdfContainer.style.width = '210mm';
      makeupPdfContainer.style.height = '310mm';
      makeupPdfContainer.style.fontSize = '12pt';
      makeupPdfContainer.style.background = '#FCF2DF';
      makeupPdfContainer.style.fontFamily = 'Quicksand, sans-serif';
      makeupPdfContainer.style.textAlign = 'center';
      document.body.appendChild(makeupPdfContainer);
  
      // Add header with ColoriAI logo for second page
      const makeupHeader = document.createElement('div');
      makeupHeader.style.marginBottom = '2pt';
      makeupHeader.innerHTML = `
        <img src="/ColoriAI.png" alt="ColoriAI Logo" style="width: 250px; height: auto; margin-bottom: 30px; margin-top: 10px;" />
        <h2 style="font-size: 24pt; font-weight: 600; margin-bottom: 16pt; color: #3c3334;"><span style="font-weight: 400; font-size: 18pt;">Makeup Suggestion:</span> <span style="font-weight: 600;">${analysisData.seasonType}</span></h2>
        <p style="font-size: 10pt; color: #666; margin-bottom: 16pt;">Generated by ColoriAI • ${new Date().toLocaleDateString()}</p>
      `;
      makeupPdfContainer.appendChild(makeupHeader);
  
      // Create makeup content container
      const makeupContentContainer = document.createElement('div');
      makeupContentContainer.style.textAlign = 'center';
      makeupContentContainer.style.display = 'flex';
      makeupContentContainer.style.flexDirection = 'column';
      makeupContentContainer.style.alignItems = 'center';
      makeupContentContainer.style.justifyContent = 'center';
      makeupPdfContainer.appendChild(makeupContentContainer);
  
      // Add Makeup Suggestions
      const makeupSection = document.createElement('div');
      makeupSection.style.marginBottom = '8pt';
      
      makeupContentContainer.appendChild(makeupSection);
  
      // Add Foundations
      if (analysisData.makeup.foundations.length > 0) {
        const foundationsSection = document.createElement('div');
        foundationsSection.style.marginBottom = '16pt';
        foundationsSection.innerHTML = `
          <h3 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Foundations</h3>
        `;
        
        const foundationsContainer = document.createElement('div');
        foundationsContainer.style.display = 'flex';
        foundationsContainer.style.flexDirection = 'column';
        foundationsContainer.style.gap = '8pt';
        foundationsContainer.style.maxWidth = '150mm';
        foundationsContainer.style.margin = '0 auto';
        
        analysisData.makeup.foundations.forEach((product, index) => {
          const productItem = document.createElement('div');
          productItem.style.display = 'flex';
          productItem.style.alignItems = 'center';
          productItem.style.gap = '8pt';
          productItem.style.padding = '8pt';
          productItem.style.backgroundColor = 'white';
          productItem.style.borderRadius = '4pt';
          productItem.style.boxShadow = '0 1pt 2pt rgba(0,0,0,0.1)';
          
          const colorCircle = document.createElement('div');
          colorCircle.style.width = '20pt';
          colorCircle.style.height = '20pt';
          colorCircle.style.borderRadius = '50%';
          colorCircle.style.backgroundColor = product.hex || '#CCCCCC';
          colorCircle.style.flexShrink = '0';
          
          const productInfo = document.createElement('div');
          productInfo.style.textAlign = 'left';
          productInfo.style.flex = '1';
          productInfo.innerHTML = `
            <p style="font-size: 10pt; font-weight: 500; margin: 0; color: #3c3334;">${product.brand} ${product.product}</p>
            <p style="font-size: 8pt; margin: 0; color: #666;">${product.shade}</p>
          `;
          
          productItem.appendChild(colorCircle);
          productItem.appendChild(productInfo);
          foundationsContainer.appendChild(productItem);
        });
        
        foundationsSection.appendChild(foundationsContainer);
        makeupContentContainer.appendChild(foundationsSection);
      }
  
      // Add Korean Cushion
      if (analysisData.makeup.cushion && analysisData.makeup.cushion.brand) {
        const cushionSection = document.createElement('div');
        cushionSection.style.marginBottom = '16pt';
        cushionSection.innerHTML = `
          <h3 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Korean Cushion</h3>
        `;
        
        const cushionItem = document.createElement('div');
        cushionItem.style.display = 'flex';
        cushionItem.style.alignItems = 'center';
        cushionItem.style.gap = '8pt';
        cushionItem.style.padding = '8pt';
        cushionItem.style.backgroundColor = 'white';
        cushionItem.style.borderRadius = '4pt';
        cushionItem.style.boxShadow = '0 1pt 2pt rgba(0,0,0,0.1)';
        cushionItem.style.maxWidth = '150mm';
        cushionItem.style.margin = '0 auto';
        
        const colorCircle = document.createElement('div');
        colorCircle.style.width = '20pt';
        colorCircle.style.height = '20pt';
        colorCircle.style.borderRadius = '50%';
        colorCircle.style.backgroundColor = analysisData.makeup.cushion.hex || '#CCCCCC';
        colorCircle.style.flexShrink = '0';
        
        const productInfo = document.createElement('div');
        productInfo.style.textAlign = 'left';
        productInfo.style.flex = '1';
        productInfo.innerHTML = `
          <p style="font-size: 10pt; font-weight: 500; margin: 0; color: #3c3334;">${analysisData.makeup.cushion.brand} ${analysisData.makeup.cushion.product}</p>
          <p style="font-size: 8pt; margin: 0; color: #666;">${analysisData.makeup.cushion.shade}</p>
        `;
        
        cushionItem.appendChild(colorCircle);
        cushionItem.appendChild(productInfo);
        cushionSection.appendChild(cushionItem);
        makeupContentContainer.appendChild(cushionSection);
      }
  
      // Add Lipsticks
      if (analysisData.makeup.lipsticks.length > 0) {
        const lipsticksSection = document.createElement('div');
        lipsticksSection.style.marginBottom = '16pt';
        lipsticksSection.innerHTML = `
          <h3 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Lipsticks</h3>
        `;
        
        const lipsticksContainer = document.createElement('div');
        lipsticksContainer.style.display = 'flex';
        lipsticksContainer.style.flexDirection = 'column';
        lipsticksContainer.style.gap = '8pt';
        lipsticksContainer.style.maxWidth = '150mm';
        lipsticksContainer.style.margin = '0 auto';
        
        analysisData.makeup.lipsticks.forEach((product, index) => {
          const productItem = document.createElement('div');
          productItem.style.display = 'flex';
          productItem.style.alignItems = 'center';
          productItem.style.gap = '8pt';
          productItem.style.padding = '8pt';
          productItem.style.backgroundColor = 'white';
          productItem.style.borderRadius = '4pt';
          productItem.style.boxShadow = '0 1pt 2pt rgba(0,0,0,0.1)';
          
          const colorCircle = document.createElement('div');
          colorCircle.style.width = '20pt';
          colorCircle.style.height = '20pt';
          colorCircle.style.borderRadius = '50%';
          colorCircle.style.backgroundColor = product.hex || '#CCCCCC';
          colorCircle.style.flexShrink = '0';
          
          const productInfo = document.createElement('div');
          productInfo.style.textAlign = 'left';
          productInfo.style.flex = '1';
          productInfo.innerHTML = `
            <p style="font-size: 10pt; font-weight: 500; margin: 0; color: #3c3334;">${product.brand} ${product.product}</p>
            <p style="font-size: 8pt; margin: 0; color: #666;">${product.shade}</p>
          `;
          
          productItem.appendChild(colorCircle);
          productItem.appendChild(productInfo);
          lipsticksContainer.appendChild(productItem);
        });
        
        lipsticksSection.appendChild(lipsticksContainer);
        makeupContentContainer.appendChild(lipsticksSection);
      }
  
      // Add Blushes
      if (analysisData.makeup.blushes.length > 0) {
        const blushesSection = document.createElement('div');
        blushesSection.style.marginBottom = '16pt';
        blushesSection.innerHTML = `
          <h3 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Blushes</h3>
        `;
        
        const blushesContainer = document.createElement('div');
        blushesContainer.style.display = 'flex';
        blushesContainer.style.flexDirection = 'column';
        blushesContainer.style.gap = '8pt';
        blushesContainer.style.maxWidth = '150mm';
        blushesContainer.style.margin = '0 auto';
        
        analysisData.makeup.blushes.forEach((product, index) => {
          const productItem = document.createElement('div');
          productItem.style.display = 'flex';
          productItem.style.alignItems = 'center';
          productItem.style.gap = '8pt';
          productItem.style.padding = '8pt';
          productItem.style.backgroundColor = 'white';
          productItem.style.borderRadius = '4pt';
          productItem.style.boxShadow = '0 1pt 2pt rgba(0,0,0,0.1)';
          
          const colorCircle = document.createElement('div');
          colorCircle.style.width = '20pt';
          colorCircle.style.height = '20pt';
          colorCircle.style.borderRadius = '50%';
          colorCircle.style.backgroundColor = product.hex || '#CCCCCC';
          colorCircle.style.flexShrink = '0';
          
          const productInfo = document.createElement('div');
          productInfo.style.textAlign = 'left';
          productInfo.style.flex = '1';
          productInfo.innerHTML = `
            <p style="font-size: 10pt; font-weight: 500; margin: 0; color: #3c3334;">${product.brand} ${product.product}</p>
            <p style="font-size: 8pt; margin: 0; color: #666;">${product.shade}</p>
          `;
          
          productItem.appendChild(colorCircle);
          productItem.appendChild(productInfo);
          blushesContainer.appendChild(productItem);
        });
        
        blushesSection.appendChild(blushesContainer);
        makeupContentContainer.appendChild(blushesSection);
      }
  
      // Add Eyeshadow Palettes
      if (analysisData.makeup.eyeshadows.length > 0) {
        const eyeshadowsSection = document.createElement('div');
        eyeshadowsSection.style.marginBottom = '16pt';
        eyeshadowsSection.innerHTML = `
          <h3 style="font-size: 14pt; font-weight: 600; margin-bottom: 8pt; color: #3c3334;">Eyeshadow Palettes</h3>
        `;
        
        const eyeshadowsContainer = document.createElement('div');
        eyeshadowsContainer.style.display = 'flex';
        eyeshadowsContainer.style.flexDirection = 'column';
        eyeshadowsContainer.style.gap = '8pt';
        eyeshadowsContainer.style.maxWidth = '150mm';
        eyeshadowsContainer.style.margin = '0 auto';
        
        analysisData.makeup.eyeshadows.forEach((product, index) => {
          const productItem = document.createElement('div');
          productItem.style.display = 'flex';
          productItem.style.alignItems = 'center';
          productItem.style.gap = '8pt';
          productItem.style.padding = '8pt';
          productItem.style.backgroundColor = 'white';
          productItem.style.borderRadius = '4pt';
          productItem.style.boxShadow = '0 1pt 2pt rgba(0,0,0,0.1)';
          
          const colorCircle = document.createElement('div');
          colorCircle.style.width = '20pt';
          colorCircle.style.height = '20pt';
          colorCircle.style.borderRadius = '50%';
          colorCircle.style.backgroundColor = product.hex || '#CCCCCC';
          colorCircle.style.flexShrink = '0';
          
          const productInfo = document.createElement('div');
          productInfo.style.textAlign = 'left';
          productInfo.style.flex = '1';
          productInfo.innerHTML = `
            <p style="font-size: 10pt; font-weight: 500; margin: 0; color: #3c3334;">${product.brand} ${product.product}</p>
            <p style="font-size: 8pt; margin: 0; color: #666;">${product.shade}</p>
          `;
          
          productItem.appendChild(colorCircle);
          productItem.appendChild(productInfo);
          eyeshadowsContainer.appendChild(productItem);
        });
        
        eyeshadowsSection.appendChild(eyeshadowsContainer);
        makeupContentContainer.appendChild(eyeshadowsSection);
      }
  
      // Generate canvas for makeup page
      const makeupCanvas = await html2canvas(makeupPdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FCF2DF',
        width: makeupPdfContainer.offsetWidth,
        height: makeupPdfContainer.offsetHeight
      });
  
      // Clean up makeup container
      document.body.removeChild(makeupPdfContainer);
  
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
  
      // Calculate image dimensions with margins
      const margin = 15;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      // Add first page content
      let heightLeft = imgHeight;
      let position = margin;
      const pageContentHeight = pageHeight - (margin * 2);
  
      pdf.addImage(canvas, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
  
      // Add additional pages if needed for first page content
      while (heightLeft > pageContentHeight) {
        position -= pageContentHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageContentHeight;
      }
  
      // Add second page with makeup suggestions
      pdf.addPage();
      
      // Calculate makeup page image dimensions
      const makeupImgWidth = pageWidth - (margin * 2);
      const makeupImgHeight = (makeupCanvas.height * makeupImgWidth) / makeupCanvas.width;
      
      // Add makeup page content
      let makeupHeightLeft = makeupImgHeight;
      let makeupPosition = margin;
      
      pdf.addImage(makeupCanvas, 'JPEG', margin, makeupPosition, makeupImgWidth, makeupImgHeight, undefined, 'FAST');
      
      // Add clickable "View Product" links for makeup products
      let linkY = makeupPosition + 45; // Moved up 6px from 51 to 45
      
      // Add Foundations links
      if (analysisData.makeup.foundations.length > 0) {
        linkY += 20; // Space for section title
        analysisData.makeup.foundations.forEach((product, index) => {
          if (product.url) {
            const linkX = margin + makeupImgWidth - 36; // Increased gap by 1px from 35 to 36
            pdf.setTextColor(0, 102, 204); // Blue color
            pdf.setFontSize(8);
            pdf.link(linkX, linkY, 30, 5, { url: product.url });
            pdf.text('View Product', linkX, linkY + 3);
          }
          // Move second foundation down 1px
          if (index === 1) {
            linkY += 13; // 12 + 1 = 13px for second foundation
          } else {
            linkY += 12; // Reduced space between products
          }
        });
      }
      
      // Add Korean Cushion link
      if (analysisData.makeup.cushion && analysisData.makeup.cushion.url) {
        linkY += 15; // Space for section title
        const linkX = margin + makeupImgWidth - 36;
        pdf.setTextColor(0, 102, 204);
        pdf.setFontSize(8);
        pdf.link(linkX, linkY, 30, 5, { url: analysisData.makeup.cushion.url });
        pdf.text('View Product', linkX, linkY + 3);
        linkY += 12;
      }
      
      // Add Lipsticks links
      if (analysisData.makeup.lipsticks.length > 0) {
        linkY += 15; // Space for section title
        analysisData.makeup.lipsticks.forEach((product, index) => {
          if (product.url) {
            const linkX = margin + makeupImgWidth - 36;
            pdf.setTextColor(0, 102, 204);
            pdf.setFontSize(8);
            pdf.link(linkX, linkY, 30, 5, { url: product.url });
            pdf.text('View Product', linkX, linkY + 3);
          }
          linkY += 13; // Increased gap by 1px from 12 to 13
        });
      }
      
      // Add Blushes links
      if (analysisData.makeup.blushes.length > 0) {
        linkY += 15; // Space for section title
        analysisData.makeup.blushes.forEach((product, index) => {
          if (product.url) {
            const linkX = margin + makeupImgWidth - 36;
            pdf.setTextColor(0, 102, 204);
            pdf.setFontSize(8);
            pdf.link(linkX, linkY, 30, 5, { url: product.url });
            pdf.text('View Product', linkX, linkY + 3);
          }
          linkY += 12;
        });
      }
      
      // Add Eyeshadow Palettes links
      if (analysisData.makeup.eyeshadows.length > 0) {
        linkY += 15; // Space for section title
        analysisData.makeup.eyeshadows.forEach((product, index) => {
          if (product.url) {
            const linkX = margin + makeupImgWidth - 36;
            pdf.setTextColor(0, 102, 204);
            pdf.setFontSize(8);
            pdf.link(linkX, linkY, 30, 5, { url: product.url });
            pdf.text('View Product', linkX, linkY + 3);
          }
          linkY += 12;
        });
      }

      // Add additional pages if needed for makeup content
      while (makeupHeightLeft > pageContentHeight) {
        makeupPosition -= pageContentHeight;
        pdf.addPage();
        pdf.addImage(makeupCanvas, 'JPEG', margin, makeupPosition, makeupImgWidth, makeupImgHeight, undefined, 'FAST');
        makeupHeightLeft -= pageContentHeight;
      }

      // Add footer with copyright outside the background on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(102, 102, 102);
        pdf.text('© 2025 ColoriAI. All rights reserved.', pageWidth / 2, pageHeight - 10, { align: 'center' });
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

        <div className="flex-1 p-6 text-[#3c3334] text-sm font-medium bg-[#FCF2DF] h-[calc(822px-200px)] overflow-y-auto">
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
            <p className={styles.reportTitle}>OUTFIT GUIDE</p>
            {analysisData.outfit.generatedImage && 
             analysisData.outfit.generatedImage !== '/outfit-demo.png' && 
             analysisData.outfit.generatedImage !== 'undefined' && 
             analysisData.outfit.generatedImage !== 'null' ? (
              <Image
                src={analysisData.outfit.generatedImage}
                alt="Style Outfit"
                width={320}
                height={320}
                className="mx-auto rounded-lg mb-[50px] object-cover"
              />
            ) : (
              <Image
                src="/outfit-demo.png"
                alt="Style Outfit"
                width={320}
                height={320}
                className="mx-auto rounded-lg mb-[50px] object-cover"
              />
            )}
            {analysisData.outfit.imagePrompt && (
              <div className="m-[20px] mb-[50px] text-sm">
                <p className="font-black">Outfit Description:</p> 
                <p>{analysisData.outfit.imagePrompt.replace(/\*\*/g, '')}</p>
              </div>
            )}
          </div>

           {/* Makeup Suggestion */}
         
  <div className="mt-[20px] mb-[50px] px-6">
  <p className={styles.reportTitle}>MAKEUP SUGGESTION</p>

  {/* Foundations */}
  {analysisData.makeup.foundations.length > 0 && (
    <div className="mb-6">
      <h3 className="font-medium text-base m-[20px]">Foundations</h3>
      <div className="grid grid-cols-1 gap-3">
        {analysisData.makeup.foundations.map((product) => (
          <div key={product.hex} className={`flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm`}>
            <div className="flex flex-col items-center gap-1">
              <div 
                className="w-[40px] h-[40px] rounded-full m-[20px]"
                style={{ backgroundColor: product.hex || '#CCCCCC' }}
              />

            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{product.brand} {product.product}</p>
              <p className="text-sm text-gray-600">{product.shade}</p>
            </div>
            {product.url && (
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline text-xs whitespace-nowrap mr-[10px]"
              >
                View Product
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
      <h3 className="font-medium text-base m-[20px]">Korean Cushion</h3>
      <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
        <div className="flex flex-col items-center gap-1">
          <div 
            className="w-[40px] h-[40px] rounded-full m-[20px]"
            style={{ backgroundColor: analysisData.makeup.cushion.hex || '#CCCCCC' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{analysisData.makeup.cushion.brand} {analysisData.makeup.cushion.product}</p>
          <p className="text-sm text-gray-600">{analysisData.makeup.cushion.shade}</p>
        </div>
        {analysisData.makeup.cushion.url && (
          <a 
            href={analysisData.makeup.cushion.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline text-xs whitespace-nowrap mr-[10px]"
            >
              View Product
            </a>
        )}
      </div>
    </div>
  )}

  {/* Lipsticks */}
  {analysisData.makeup.lipsticks.length > 0 && (
    <div className="mb-6">
      <h3 className="font-medium text-base m-[20px]">Lipsticks</h3>
      <div className="grid grid-cols-1 gap-4">
        {analysisData.makeup.lipsticks.map((product) => (
          <div key={product.hex} className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm -mt-1">
            <div className="flex flex-col items-center gap-1">
              <div 
                className="w-[40px] h-[40px] rounded-full m-[20px]"
                style={{ backgroundColor: product.hex || '#CCCCCC' }}
              />
          
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{product.brand} {product.product}</p>
              <p className="text-sm text-gray-600">{product.shade}</p>
            </div>
            {product.url && (
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline text-xs whitespace-nowrap mr-[10px]"
              >
                View Product
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
      <h3 className="font-medium text-base m-[20px]">Blushes</h3>
      <div className="grid grid-cols-1 gap-3">
        {analysisData.makeup.blushes.map((product) => (
          <div key={product.hex} className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
            <div 
              className="w-[40px] h-[40px] rounded-full m-[20px]" 
              style={{ backgroundColor: product.hex || '#CCCCCC' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{product.brand}</p>
              <p className="text-sm text-gray-600">{product.product} • {product.shade}</p>
            </div>
            {product.url && (
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline text-xs whitespace-nowrap mr-[10px]"
              >
                View Product
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
      <h3 className="font-medium text-base  m-[20px]">Eyeshadow Palettes</h3>
      <div className="grid grid-cols-1 gap-3">
        {analysisData.makeup.eyeshadows.map((product, index) => (
          <div key={product.hex} className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
            {product.hex && (
              <div className="flex flex-col items-center gap-1">
                <div 
                  className="w-[40px] h-[40px] rounded-full m-[20px]"
                  style={{ backgroundColor: product.hex || '#CCCCCC' }}
                />
            
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{product.brand} {product.product}</p>
              {product.shade && (
                <p className="text-sm text-gray-600">{product.shade}</p>
              )}
            </div>
            {product.url && (
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline text-xs whitespace-nowrap"
              >
                View Product
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )}
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