// src/routes/teamTaskRoutes.js
import express from "express";
import { createTeamTask, getTeamTasks } from "../controllers/teamTaskController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Créer une tâche pour une équipe
// Exemple d'URL : POST /api/teams/:teamId/tasks
router.post("/:teamId/tasks", auth, createTeamTask);

// Récupérer les tâches d'une équipe
// Exemple d'URL : GET /api/teams/:teamId/tasks
router.get("/:teamId/tasks", auth, getTeamTasks);

export default router;
