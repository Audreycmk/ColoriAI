// src/lib/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: Use NEXT_PUBLIC_GEMINI_API_KEY in .env.local
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("NEXT_PUBLIC_GEMINI_API_KEY is not set. Please set it in your .env.local file.");
  throw new Error("Gemini API key is missing. Check your .env.local file.");
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Analyze an uploaded image using Gemini 1.5 Flash model
 * Adds age and style to improve personalization
 */
export async function analyzeFace(imageBase64: string, age?: string, style?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
   - Skin undertone (avoid makeup)
   - Natural eye color
   - Natural hair color

   Based on these features, analyze and provide the following in Markdown format:

   1. **Seasonal Color Type** e.g. Soft Autumn

   2. **Color Extraction** (CSV format):  
      Label, HEX  
      Example:  
      Face, #EDC1A8  
      Eye, #6A5554  
      Hair, #3C3334

   3. **9-Color Seasonal Palette** (CSV: Name, HEX)  
      e.g. Dusty Rose, #C0A6A1

   4. **Jewelry Tone** e.g. Gold, #D4AF37

   5. **2 Flattering Hair Colors** (CSV: Name, HEX)

   6. **Makeup Suggestions** - 2 Foundations (Brand, Product, Shade, HEX, URL)  
      - 1 Korean Cushion  
      - 4 Lipsticks  
      - 2 Blushes  
      - 2 Eyeshadow Palettes  
      Use only real, purchasable products. Provide HEX and URLs.

   7. **2 Similar Celebrities** — name only (no images or descriptions)

   8. **Image Prompt** Flatlay of a **${promptStyle}** summer outfit for a person around age **${promptAge}**.  
   Include exactly **5 items**:  
   - 1 top  
   - 1 bottom  
   - 1 pair of shoes  
   - 1 bag  
   - 1 pair of glasses  

   Use **only 3 HEX colors** from the seasonal palette.  
   No people, no shadows, no accessories.  
   Background must be clean and layout visible.  
   Give a single sentence output, formatted for use in DALL·E 3.
   `;

      const result = await model.generateContent([
         { inlineData: { data: base64Data, mimeType } },
         prompt,
      ]);

      const response = await result.response;
      const textResult = await response.text();
      console.log("lib/gemini.ts: Gemini response received. Text length:", textResult.length);
      return textResult;

   } catch (error: unknown) {
      console.error('Error analyzing image:', error);
      if (error instanceof Error) {
         throw new Error(`Failed to analyze image: ${error.message}`);
      }
      throw new Error('Failed to analyze image: Unknown error occurred');
   }
}