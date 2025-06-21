import mongoose, { Schema, models, model } from 'mongoose';

const ReportSchema = new Schema({
  userId: { type: String, required: true },
  result: {
    seasonType: { type: String },
    colorExtraction: [{ label: String, hex: String }],
    colorPalette: [{ name: String, hex: String }],
  },
  outfitImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  isDeleted: { 
    type: Boolean, 
    default: false, 
    required: true,
    index: true 
  },
});

// Add compound index for better query performance
ReportSchema.index({ userId: 1, isDeleted: 1 });

const Report = models.Report || model('Report', ReportSchema);
export default Report;
