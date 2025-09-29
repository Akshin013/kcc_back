import express from "express";
import { loginAdmin } from "../controllers/adminController.js";

const router = express.Router();
router.post("/admin", loginAdmin);

export default router;
