import Car from "../models/Car.js";

export const getCars = async (req, res) => {
  const cars = await Car.find();
  res.json(cars);
};

export const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Машина не найдена" });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addCar = async (req, res) => {
  const { brand, model, year, mileage, price } = req.body;
  const photos = req.files ? req.files.map(f => f.filename) : [];
  const newCar = new Car({ brand, model, year, mileage, price, photos });
  await newCar.save();
  res.json({ message: "Машина добавлена" });
};
