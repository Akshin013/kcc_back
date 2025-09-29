// routes/cars.js
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Car from "../models/Car.js";

const router = express.Router();

// 🔑 Настройка Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// 🔧 multer — хранение файлов в памяти
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📌 ХЕЛПЕР для загрузки в Cloudinary
const uploadToCloudinary = (file, folder = "cars") =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: file.mimetype.startsWith("video") ? "video" : "image" },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    ).end(file.buffer);
  });

// Генерация уникального 4-значного carId
const generateCarId = async () => {
  let id, exists = true;
  while (exists) {
    id = Math.floor(1000 + Math.random() * 9000);
    exists = await Car.findOne({ carId: id });
  }
  return id;
};

// === Добавление машины ===
router.post("/", upload.fields([{ name: "images" }, { name: "videos" }]), async (req, res) => {
  try {
    const { marka, model, qiymet, il, km, yerSayi, lyuk, boya, deyisen, yanacaq } = req.body;

    const carId = await generateCarId();

    const images = req.files.images
      ? await Promise.all(req.files.images.map(file => uploadToCloudinary(file, "cars/images")))
      : [];

    const videos = req.files.videos
      ? await Promise.all(req.files.videos.map(file => uploadToCloudinary(file, "cars/videos")))
      : [];

    const newCar = new Car({
      carId, marka, model, qiymet, il, km, yerSayi, lyuk, boya, deyisen, yanacaq, images, videos, createdAt: new Date()
    });

    await newCar.save();
    res.status(201).json(newCar);

  } catch (error) {
    console.error("❌ Ошибка при добавлении машины:", error);
    res.status(500).json({ message: "Ошибка при добавлении машины", error: error.message });
  }
});

// === Получение всех машин ===
router.get("/", async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    console.error("❌ Ошибка при получении машин:", err);
    res.status(500).json({ message: "Ошибка при получении машин", error: err.message });
  }
});

// === Получение машины по id ===
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Проверка валидности ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Невалидный id" });
    }

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: "Машина не найдена" });

    res.json(car);

  } catch (err) {
    console.error("❌ Ошибка при получении машины:", err);
    res.status(500).json({ message: "Ошибка при получении машины", error: err.message });
  }
});

// === Редактирование машины ===
router.put("/:id", upload.fields([{ name: "images" }, { name: "videos" }]), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Невалидный id" });

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: "Машина не найдена" });

    const { marka, model, qiymet, il, km, yerSayi, lyuk, boya, deyisen, yanacaq, sold } = req.body;

    car.marka = marka ?? car.marka;
    car.model = model ?? car.model;
    car.qiymet = qiymet ?? car.qiymet;
    car.il = il ?? car.il;
    car.km = km ?? car.km;
    car.yerSayi = yerSayi ?? car.yerSayi;
    car.lyuk = lyuk !== undefined ? lyuk === "true" : car.lyuk;
    car.boya = boya ?? car.boya;
    car.deyisen = deyisen ?? car.deyisen;
    car.yanacaq = yanacaq ?? car.yanacaq;
    car.sold = sold !== undefined ? sold === "true" : car.sold;

    if (req.files.images?.length) {
      const newImages = await Promise.all(req.files.images.map(file => uploadToCloudinary(file, "cars/images")));
      car.images.push(...newImages);
    }

    if (req.files.videos?.length) {
      const newVideos = await Promise.all(req.files.videos.map(file => uploadToCloudinary(file, "cars/videos")));
      car.videos.push(...newVideos);
    }

    await car.save();
    res.json(car);

  } catch (err) {
    console.error("❌ Ошибка при редактировании машины:", err);
    res.status(500).json({ message: "Ошибка при редактировании машины", error: err.message });
  }
});

// === Удаление машины ===
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Невалидный id" });

    const car = await Car.findByIdAndDelete(id);
    if (!car) return res.status(404).json({ message: "Машина не найдена" });

    res.json({ message: "Машина успешно удалена" });

  } catch (err) {
    console.error("❌ Ошибка при удалении машины:", err);
    res.status(500).json({ message: "Ошибка при удалении машины", error: err.message });
  }
});

export default router;
