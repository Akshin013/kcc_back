import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
  carId: { type: Number, unique: true, required: true },
  marka: String,
  model: String,
  qiymet: Number,
  il: Number,
  km: Number,
  yerSayi: Number,
  lyuk: Boolean,
  boya: String,
  deyisen: String,
  yanacaq: String,
  vin: String, // 🆕 VIN-код как обычная строка
  sold: { type: Boolean, default: false },
  images: [String],
  videos: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Car", carSchema);
