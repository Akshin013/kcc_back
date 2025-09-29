// routes/cars.js
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Car from "../models/Car.js";

const router = express.Router();

// 🔑 Настройка Cloudinary
cloudinary.config({
  cloud_name: "dsigbmb7p",
  api_key: "785866647597651",
  api_secret: "Awc-sndEHqIsoKr0BGDsUfFb87o",
});

// 🔧 multer — хранение файлов в памяти
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📌 ХЕЛПЕР для загрузки в Cloudinary
const uploadToCloudinary = (file, folder = "cars") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: file.mimetype.startsWith("video") ? "video" : "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    ).end(file.buffer);
  });
};

// === Добавление машины ===
// Генерация уникального 4-значного carId
const generateCarId = async () => {
  let id;
  let exists = true;

  while (exists) {
    id = Math.floor(1000 + Math.random() * 9000); // 4-значное число
    exists = await Car.findOne({ carId: id });
  }

  return id;
};

router.post("/", upload.fields([{ name: "images" }, { name: "videos" }]), async (req, res) => {
  try {
    const { marka, model, qiymet, il, km, yerSayi, lyuk, boya, deyisen, yanacaq } = req.body;

    const carId = await generateCarId(); // 🔥 создаём автоматически

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

router.patch("/:id/sold", async (req, res) => {
  try {
    const { sold } = req.body; // ожидаем JSON { sold: true/false }
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { sold },
      { new: true }
    );
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

    // ⚠️ Можно удалить файлы с Cloudinary, если нужно

    res.json({ message: "Машина успешно удалена" });
  } catch (err) {
    console.error("❌ Ошибка при удалении машины:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
