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
});

const Report = models.Report || model('Report', ReportSchema);
export default Report;
