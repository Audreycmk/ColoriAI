// src/lib/gemini.ts

import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

// IMPORTANT: Use NEXT_PUBLIC_GEMINI_API_KEY in .env.local
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("NEXT_PUBLIC_GEMINI_API_KEY is not set. Please set it in your .env.local file.");
  throw new Error("Gemini API key is missing. Check your .env.local file.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const productSchema: Schema = {
   type: SchemaType.OBJECT,
   properties: {
      brand: { type: SchemaType.STRING },
      product: { type: SchemaType.STRING },
      shade: { type: SchemaType.STRING },
      hex: { type: SchemaType.STRING },
      url: { type: SchemaType.STRING },
   },
   required: ['brand', 'product', 'shade', 'hex', 'url'],
};

const colorExtractionSchema: Schema = {
   type: SchemaType.OBJECT,
   properties: {
      label: { type: SchemaType.STRING },
      hex: { type: SchemaType.STRING },
   },
   required: ['label', 'hex'],
};

const paletteColorSchema: Schema = {
   type: SchemaType.OBJECT,
   properties: {
      name: { type: SchemaType.STRING },
      hex: { type: SchemaType.STRING },
   },
   required: ['name', 'hex'],
};

const analysisSchema: Schema = {
   type: SchemaType.OBJECT,
   properties: {
      seasonalColorType: { type: SchemaType.STRING },
      colorExtraction: { type: SchemaType.ARRAY, items: colorExtractionSchema },
      seasonalPalette: { type: SchemaType.ARRAY, items: paletteColorSchema },
      jewelryTone: {
         type: SchemaType.OBJECT,
         properties: {
            name: { type: SchemaType.STRING },
            hex: { type: SchemaType.STRING },
         },
         required: ['name', 'hex'],
      },
      hairColors: { type: SchemaType.ARRAY, items: paletteColorSchema },
      makeup: {
         type: SchemaType.OBJECT,
         properties: {
            foundations: { type: SchemaType.ARRAY, items: productSchema },
            koreanCushion: productSchema,
            lipsticks: { type: SchemaType.ARRAY, items: productSchema },
            blushes: { type: SchemaType.ARRAY, items: productSchema },
            eyeshadowPalettes: { type: SchemaType.ARRAY, items: productSchema },
         },
         required: ['foundations', 'koreanCushion', 'lipsticks', 'blushes', 'eyeshadowPalettes'],
      },
      similarCelebrities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      imagePrompt: { type: SchemaType.STRING },
   },
   required: [
      'seasonalColorType',
      'colorExtraction',
      'seasonalPalette',
      'jewelryTone',
      'hairColors',
      'makeup',
      'similarCelebrities',
      'imagePrompt',
   ],
};

type Product = {
   brand: string;
   product: string;
   shade: string;
   hex: string;
   url: string;
};

function requireRecord(value: unknown, field: string): Record<string, unknown> {
   if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`Gemini returned invalid ${field}`);
   }
   return value as Record<string, unknown>;
}

function requireText(value: unknown, field: string): string {
   if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`Gemini returned invalid ${field}`);
   }
   return value.trim();
}

function requireHex(value: unknown, field: string): string {
   const rawHex = requireText(value, field);
   const match = rawHex.match(/^(?:#|0x)?([0-9a-f]{3}|[0-9a-f]{6})$/i);
   if (!match) {
      throw new Error(`Gemini returned invalid ${field}: ${JSON.stringify(rawHex.slice(0, 32))}`);
   }

   const digits = match[1].length === 3
      ? [...match[1]].map((digit) => digit + digit).join('')
      : match[1];
   return `#${digits.toUpperCase()}`;
}

function requireArray(value: unknown, field: string, expectedLength: number): unknown[] {
   if (!Array.isArray(value) || value.length !== expectedLength) {
      throw new Error(`Gemini returned invalid ${field}; expected ${expectedLength} items`);
   }
   return value;
}

function parseProducts(value: unknown, field: string, count: number): Product[] {
   return requireArray(value, field, count).map((entry, index) => {
      const product = requireRecord(entry, `${field}[${index}]`);
      const url = requireText(product.url, `${field}[${index}].url`);
      if (!URL.canParse(url) || new URL(url).protocol !== 'https:') {
         throw new Error(`Gemini returned invalid ${field}[${index}].url`);
      }
      return {
         brand: requireText(product.brand, `${field}[${index}].brand`),
         product: requireText(product.product, `${field}[${index}].product`),
         shade: requireText(product.shade, `${field}[${index}].shade`),
         hex: requireHex(product.hex, `${field}[${index}].hex`),
         url,
      };
   });
}

function formatAnalysis(value: unknown): string {
   const analysis = requireRecord(value, 'analysis');
   const season = requireText(analysis.seasonalColorType, 'seasonalColorType');
   if (!/^(?:(?:Light|True|Warm|Soft|Deep|Cool|Bright|Clear|Muted|Dark)\s+)?(?:Spring|Summer|Autumn|Fall|Winter)(?:\s*\([^)]*\))?$/i.test(season)) {
      throw new Error('Gemini returned an invalid seasonal color type');
   }

   const colorExtraction = requireArray(analysis.colorExtraction, 'colorExtraction', 3).map((entry, index) => {
      const color = requireRecord(entry, `colorExtraction[${index}]`);
      return {
         label: requireText(color.label, `colorExtraction[${index}].label`),
         hex: requireHex(color.hex, `colorExtraction[${index}].hex`),
      };
   });
   if (colorExtraction.some((color, index) => color.label.toLowerCase() !== ['face', 'eye', 'hair'][index])) {
      throw new Error('Gemini returned invalid colorExtraction labels');
   }
   const seasonalPalette = requireArray(analysis.seasonalPalette, 'seasonalPalette', 9).map((entry, index) => {
      const color = requireRecord(entry, `seasonalPalette[${index}]`);
      return {
         name: requireText(color.name, `seasonalPalette[${index}].name`),
         hex: requireHex(color.hex, `seasonalPalette[${index}].hex`),
      };
   });
   const jewelryTone = requireRecord(analysis.jewelryTone, 'jewelryTone');
   const jewelryName = requireText(jewelryTone.name, 'jewelryTone.name');
   const jewelryHex = requireHex(jewelryTone.hex, 'jewelryTone.hex');
   const hairColors = requireArray(analysis.hairColors, 'hairColors', 2).map((entry, index) => {
      const color = requireRecord(entry, `hairColors[${index}]`);
      return {
         name: requireText(color.name, `hairColors[${index}].name`),
         hex: requireHex(color.hex, `hairColors[${index}].hex`),
      };
   });
   const makeup = requireRecord(analysis.makeup, 'makeup');
   const foundations = parseProducts(makeup.foundations, 'foundations', 2);
   const koreanCushion = parseProducts([makeup.koreanCushion], 'koreanCushion', 1)[0];
   const lipsticks = parseProducts(makeup.lipsticks, 'lipsticks', 4);
   const blushes = parseProducts(makeup.blushes, 'blushes', 2);
   const eyeshadowPalettes = parseProducts(makeup.eyeshadowPalettes, 'eyeshadowPalettes', 2);
   const celebrities = requireArray(analysis.similarCelebrities, 'similarCelebrities', 2)
      .map((name, index) => requireText(name, `similarCelebrities[${index}]`));
   const imagePrompt = requireText(analysis.imagePrompt, 'imagePrompt').replace(/\s+/g, ' ');

   const csvCell = (cell: string) => cell.replace(/,/g, ' - ').replace(/[\r\n]/g, ' ').trim();
   const productRows = (products: Product[]) => products.map((product) =>
      [product.brand, product.product, product.shade, product.hex, product.url].map(csvCell).join(', ')
   );
   const colorRows = (colors: { name: string; hex: string }[]) =>
      colors.map((color) => `${csvCell(color.name)}, ${color.hex}`);

   return [
      `1. **Seasonal Color Type**: ${season}`,
      '2. **Color Extraction**\nLabel, HEX\n' + colorExtraction.map((color) => `${csvCell(color.label)}, ${color.hex}`).join('\n'),
      '3. **9-Color Seasonal Palette**\nName, HEX\n' + colorRows(seasonalPalette).join('\n'),
      `4. Jewelry Tone: ${csvCell(jewelryName)}, ${jewelryHex}`,
      '5. **2 Flattering Hair Colors**\nName, HEX\n' + colorRows(hairColors).join('\n'),
      [
         '6. **Makeup Suggestions**',
         'Foundations:\nBrand, Product, Shade, HEX, URL\n' + productRows(foundations).join('\n'),
         'Korean Cushion:\nBrand, Product, Shade, HEX, URL\n' + productRows([koreanCushion]).join('\n'),
         'Lipsticks:\nBrand, Product, Shade, HEX, URL\n' + productRows(lipsticks).join('\n'),
         'Blushes:\nBrand, Product, Shade, HEX, URL\n' + productRows(blushes).join('\n'),
         'Eyeshadow Palettes:\nBrand, Product, Shade, HEX, URL\n' + productRows(eyeshadowPalettes).join('\n'),
      ].join('\n\n'),
      '7. Similar Celebrities:\n' + celebrities.map((name) => `- ${csvCell(name)}`).join('\n'),
      `8. Image Prompt: ${imagePrompt.replace(/:/g, ' -')}`,
   ].join('\n\n');
}

/**
 * Analyze an uploaded image using Gemini 1.5 Flash model
 * Adds age and style to improve personalization
 */
export async function analyzeFace(imageBase64: string, age?: string, style?: string) {
  try {
      const model = genAI.getGenerativeModel({
         model: "gemini-3.5-flash-lite",
         generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
         },
      });
 
    // Parse base64 input and extract MIME type
    const parts = imageBase64.split(',');
    if (parts.length < 2) {
      throw new Error("Invalid imageBase64 format. Expected a data URL.");
    }

    const mimeType = parts[0].split(':')[1].split(';')[0]; // e.g., image/jpeg
    const base64Data = parts[1];

    console.log(`lib/gemini.ts: Sending image to Gemini. MIME Type: ${mimeType}, Data Length: ${base64Data.length}`);

    // Determine the age and style to use in the prompt, with refined fallbacks
    // If age is "Prefer not to say", default to '35'. Otherwise, use the provided age (which will be a range).
    // If age is undefined/null for some reason, also default to '35'.
    const promptAge = age === 'Prefer not to say' ? '35' : age || '35';

    // If style is provided, use it. Otherwise, default to 'Daily'.
    // This provides robustness even if UI guarantees choice.
    const promptStyle = style || 'Daily'; 

    const prompt = `                   
   You are a professional Korean 16-season color stylist.  

   The following image is a user-submitted photo for seasonal color analysis.  
   The user is approximately **${promptAge} years old** and prefers a **${promptStyle}** style.

   ⚠️ Do not identify or describe the person.  
   Focus only on visible visual traits:
   - Skin color
   - Natural eye color
   - Natural hair color

   Return JSON matching the response schema exactly. Do not include Markdown, code fences, or extra keys.
   - Provide exactly 3 extracted colors (Face, Eye, Hair), 9 palette colors, and 2 hair colors.
   - Provide exactly 2 foundations, 1 Korean cushion, 4 lipsticks, 2 blushes, and 2 eyeshadow palettes.
   - Each color must have a six-digit HEX value. Each product must include a purchasable product name, shade, six-digit HEX value, and HTTPS URL.
   - Provide exactly 2 celebrity names.
   - The imagePrompt must describe an apparel-only, directly overhead flat lay on a plain white background, using only 3 colors from the seasonal palette.
   - Specify this exact layout: center, one top plus either one pair of pants or one skirt, or one dress; left column, one hat, one pair of sunglasses, and one pair of shoes; right column, one scarf, one necklace, and one handbag.
   - Keep the center clothing visually largest. Place each side item in its own clear space, fully visible and not overlapping. The clothes and accessories must be unworn and laid flat.
   - Include no person, model, mannequin, body parts, face, hands, legs, silhouette, shadows, props, duplicate items, extra accessories, or HEX codes.
   `;

      const result = await model.generateContent([
         { inlineData: { data: base64Data, mimeType } },
         prompt,
      ]);

      const response = await result.response;
      const textResult = await response.text();
      console.log("lib/gemini.ts: Gemini response received. Text length:", textResult.length);
      return formatAnalysis(JSON.parse(textResult));

   } catch (error: unknown) {
      console.error('Error analyzing image:', error);
      if (error instanceof Error) {
         throw new Error(`Failed to analyze image: ${error.message}`);
      }
      throw new Error('Failed to analyze image: Unknown error occurred');
   }
}