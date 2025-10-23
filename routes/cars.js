// routes/cars.js
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Car from "../models/Car.js";

const router = express.Router();

// 🔑 Настройка Cloudinary
cloudinary.config({
  cloud_name: "dvm6my9na",
  api_key: "241795374821197",
  api_secret: "TutoKTr9lCuBdzSOgZXh_gXDbBY",
});

// 🔧 multer — хранение файлов в памяти
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // максимум 15 MB на файл
});

// 📌 ХЕЛПЕР для загрузки в Cloudinary
const uploadToCloudinary = async (file, folder = "cars") => {
  try {
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("⏱️ Cloudinary timeout")), 60000);

      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: file.mimetype.startsWith("video") ? "video" : "image",
        },
        (err, result) => {
          clearTimeout(timeout);
          if (err) reject(err);
          else resolve(result.secure_url);
        }
      );

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null; // чтобы не крашило Promise.all
  }
};


// === Генерация уникального 4-значного carId ===
const generateCarId = async () => {
  let id;
  let exists = true;

  while (exists) {
    id = Math.floor(1000 + Math.random() * 9000); // 4-значное число
    exists = await Car.findOne({ carId: id });
  }

  return id;
};

// === Добавление машины ===
router.post("/", upload.fields([{ name: "images" }, { name: "videos" }]), async (req, res) => {
  try {
    const {
      marka,
      model,
      qiymet,
      il,
      km,
      yerSayi,
      lyuk,
      boya,
      deyisen,
      yanacaq,
      vin // ✅ добавили VIN
    } = req.body;

    const carId = await generateCarId(); // создаём автоматически

    const images = req.files.images
      ? await Promise.all(req.files.images.map(file => uploadToCloudinary(file, "cars/images")))
      : [];

    const videos = req.files.videos
      ? await Promise.all(req.files.videos.map(file => uploadToCloudinary(file, "cars/videos")))
      : [];

    const newCar = new Car({
      carId,
      marka,
      model,
      qiymet,
      il,
      km,
      yerSayi,
      lyuk,
      boya,
      deyisen,
      yanacaq,
      vin, // ✅ сохраняем VIN
      images,
      videos,
      createdAt: new Date(),
    });

    await newCar.save();
    res.status(201).json(newCar);
  } catch (error) {
    console.error("❌ Ошибка при добавлении машины:", error);
    res.status(500).json({ message: "Ошибка при добавлении машины" });
  }
});

// === Получение всех машин ===
router.get("/", async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    console.error("❌ Ошибка при получении машин:", err);
    res.status(500).json({ message: err.message });
  }
});

// === Получение машины по id ===
router.get("/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Машина не найдена" });
    res.json(car);
  } catch (err) {
    console.error("Ошибка при получении машины:", err);
    res.status(500).json({ message: err.message });
  }
});

// === Редактирование машины ===
router.put("/:id", upload.fields([{ name: "images" }, { name: "videos" }]), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Машина не найдена" });

    const {
      marka,
      model,
      qiymet,
      il,
      km,
      yerSayi,
      lyuk,
      boya,
      deyisen,
      yanacaq,
      sold,
      vin // ✅ добавили VIN в редактирование
    } = req.body;

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
    car.vin = vin ?? car.vin; // ✅ обновляем VIN при редактировании
    car.sold = sold !== undefined ? sold === "true" : car.sold;

    // новые фото → Cloudinary
    if (req.files.images && req.files.images.length > 0) {
      const newImages = await Promise.all(req.files.images.map(file => uploadToCloudinary(file, "cars/images")));
      car.images.push(...newImages);
    }

    // новые видео → Cloudinary
    if (req.files.videos && req.files.videos.length > 0) {
      const newVideos = await Promise.all(req.files.videos.map(file => uploadToCloudinary(file, "cars/videos")));
      car.videos.push(...newVideos);
    }

    await car.save();
    res.json(car);
  } catch (err) {
    console.error("❌ Ошибка при редактировании машины:", err);
    res.status(500).json({ message: err.message });
  }
});

// === Обновление статуса "продано" ===
router.patch("/:id/sold", async (req, res) => {
  try {
    const { sold } = req.body;
    const car = await Car.findByIdAndUpdate(req.params.id, { sold }, { new: true });
    if (!car) return res.status(404).json({ message: "Машина не найдена" });
    res.json(car);
  } catch (err) {
    console.error("❌ Ошибка обновления статуса продано:", err);
    res.status(500).json({ message: err.message });
  }
});

// === Удаление машины ===
router.delete("/:id", async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ message: "Машина не найдена" });
    res.json({ message: "Машина успешно удалена" });
  } catch (err) {
    console.error("❌ Ошибка при удалении машины:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
