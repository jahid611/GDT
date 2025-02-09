import express from "express";
import { getUserTeams, createTeamViaUserAPI } from "../controllers/teamController.js";
import auth from "../middleware/auth.js"; // Assurez-vous que votre middleware d'auth est exporté en default

const router = express.Router();

// Route pour récupérer les équipes d'un utilisateur
router.get("/:id/teams", auth, getUserTeams);

// Route pour créer une équipe pour un utilisateur
router.post("/:id/teams", auth, createTeamViaUserAPI);

export default router;
