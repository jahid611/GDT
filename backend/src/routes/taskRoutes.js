import express from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController.js";
import auth from "../middleware/auth.js"; // Sans accolades pour un export par défaut

const router = express.Router();

router.get("/", auth, getTasks); // Récupérer les tâches
router.post("/", auth, createTask); // Créer une tâche
router.put("/:id", auth, updateTask); // Mettre à jour une tâche
router.delete("/:id", auth, deleteTask); // Supprimer une tâche

export default router;
