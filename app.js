import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import carsRouter from "./routes/cars.js";         // исправлено
import favoritesRouter from "./routes/favorites.js"; // исправлено

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
 
mongoose.connect("mongodb+srv://KCCAvto:Askim355@cluster0.g4dme8t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(() => console.log("✅ MongoDB подключена"))
.catch((err) => console.error("❌ Ошибка подключения:", err));

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));


app.use(express.json({ limit: "10mb" })); // чтобы можно было отправлять большие JSON
app.use(express.urlencoded({ extended: true }));

app.use("/api/favorites", favoritesRouter); 
app.use("/api/cars", carsRouter);

const PORT =  5000;
app.listen(PORT, '0.0.0.0', () => 
  console.log(`🚀 Сервер запущен: http://0.0.0.0:${PORT}`)
);
