export const reportSchema = {
  id: String,
  userId: String,
  userName: String,
  colorResult: String,
  timestamp: Date,
  extractedColors: Object,
  colorPalette: Object,
  outfitImage: String,
  makeupSuggestions: Object,
  celebrityReferences: Object,
  createdAt: Date,
  updatedAt: Date,
} as const;

export type Report = {
  id: string;
  userId: string;
  userName: string;
  colorResult: string;
  timestamp: Date;
  extractedColors: Record<string, unknown>;
  colorPalette: Record<string, unknown>;
  outfitImage: string | null;
  makeupSuggestions: Record<string, unknown>;
  celebrityReferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}; 