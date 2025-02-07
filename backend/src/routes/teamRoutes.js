// src/routes/teamRoutes.js
import express from "express";
import { getUserTeams, createTeamViaUserAPI } from "../controllers/teamController.js";
import auth from "../middleware/auth.js"; // Assurez-vous que votre middleware d'authentification est exporté en default

const router = express.Router();

// Route pour récupérer les équipes d'un utilisateur
// Exemple d'URL: GET /api/users/:id/teams
router.get("/:id/teams", auth, getUserTeams);

// Route pour créer une équipe pour un utilisateur
// Exemple d'URL: POST /api/users/:id/teams
router.post("/:id/teams", auth, createTeamViaUserAPI);

export default router;
