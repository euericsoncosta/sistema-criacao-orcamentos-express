import express from "express";
import HomeController from "../controllers/HomeController.js";

const router = express.Router();

// Rota principal do sistema (Dashboard)
router.get("/", HomeController.index);

export default router;
