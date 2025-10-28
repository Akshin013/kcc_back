router.post("/", upload.fields([{ name: "images" }, { name: "videos" }]), async (req, res) => {
  try {
    const MAX_IMAGES = 5;
    const MAX_VIDEOS = 2;

    // 🔹 Ограничение количества файлов
    if (req.files.images && req.files.images.length > MAX_IMAGES) {
      return res.status(400).json({ message: `Максимум ${MAX_IMAGES} изображений` });
    }
    if (req.files.videos && req.files.videos.length > MAX_VIDEOS) {
      return res.status(400).json({ message: `Максимум ${MAX_VIDEOS} видео` });
    }

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
      vin
    } = req.body;

    const carId = await generateCarId();

    // 🔹 Загружаем сразу картинки
    const images = req.files.images
      ? await Promise.all(req.files.images.map(file => uploadToCloudinary(file, "cars/images")))
      : [];

    // 🔹 Создаём машину без видео
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
      vin,
      images,
      videos: [], // видео будут добавлены позже
      createdAt: new Date(),
    });

    await newCar.save();

    // 🔹 Асинхронная загрузка видео
    if (req.files.videos && req.files.videos.length > 0) {
      req.files.videos.forEach(async (file) => {
        const url = await uploadToCloudinary(file, "cars/videos");
        if (url) {
          await Car.findByIdAndUpdate(newCar._id, { $push: { videos: url } });
        }
      });
    }

    // 🔹 Возвращаем объект фронту сразу
    res.status(201).json(newCar);

  } catch (error) {
    console.error("❌ Ошибка при добавлении машины:", error);
    res.status(500).json({ message: "Ошибка при добавлении машины" });
  }
});
