import express from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController.js";
import auth from "../middleware/auth.js"; // Export par défaut

const router = express.Router();

router.get("/", auth, getTasks);
router.post("/", auth, createTask);  // Pas besoin de Multer ici
router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);

export default router;
