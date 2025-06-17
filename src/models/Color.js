import mongoose from "mongoose";

const ColorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hex: { type: String, required: true },
});

export default mongoose.models.Color || mongoose.model("Color", ColorSchema);
