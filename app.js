import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import carsRouter from "./routes/cars.js";
import favoritesRouter from "./routes/favorites.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ 1. Подключаем middleware до роутов
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ 2. Подключаем маршруты
app.use("/api/favorites", favoritesRouter);
app.use("/api/cars", carsRouter);

// ✅ 3. Подключаем MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB подключена"))
  .catch(err => console.error("❌ Ошибка подключения:", err));

// ✅ 4. Запускаем сервер
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Сервер запущен: http://0.0.0.0:${PORT}`);
});
