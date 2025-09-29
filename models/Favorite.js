import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },   // у каждого пользователя будет UUID
  carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true }, // ссылка на машину
}, { timestamps: true });

export default mongoose.model("Favorite", favoriteSchema);
