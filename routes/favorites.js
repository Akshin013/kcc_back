// routes/favorites.js
import express from 'express';
const router = express.Router();
import Favorite from '../models/Favorite.js'; // модель избранного

// добавить в избранное
router.post('/', async (req, res) => {
  try {
    const { userId, carId } = req.body;
    const exists = await Favorite.findOne({ userId, carId });
    if (exists) return res.status(400).json({ message: "Уже в избранном" });

    const favorite = new Favorite({ userId, carId });
    await favorite.save();
    res.status(201).json(favorite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// получить избранное пользователя
router.get('/:userId', async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.params.userId }).populate('carId');
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// удалить из избранного по _id
router.delete('/:id', async (req, res) => {
  try {
    const favorite = await Favorite.findByIdAndDelete(req.params.id);
    if (!favorite) return res.status(404).json({ message: "Не найдено" });
    res.json({ messagexx: "Удалено" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
