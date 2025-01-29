import express from "express";
import { getTaskStats } from "../controllers/statsController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getTaskStats);

export default router;