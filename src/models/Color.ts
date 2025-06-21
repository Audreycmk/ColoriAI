import { Schema, models, model } from 'mongoose';

const ColorSchema = new Schema({
  name: { type: String, required: true },
  hex: { type: String, required: true },
});

const Color = models.Color || model('Color', ColorSchema);
export default Color;
