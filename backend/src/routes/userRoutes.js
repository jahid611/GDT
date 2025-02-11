// src/routes/userRoutes.js
import express from "express";
import { getUsers, getUserProfile } from "../controllers/userController.js";
import auth from "../middleware/auth.js";
import { getUserTeams, createTeamViaUserAPI } from "../controllers/teamController.js";

const router = express.Router();

// Routes existantes pour les utilisateurs
router.get("/", auth, getUsers);
router.get("/:id", auth, getUserProfile);
// Ajoutez cette ligne dans src/routes/userRoutes.js
router.get("/:id/profile", auth, getUserProfile);


// Routes pour la gestion des équipes via un utilisateur
// Exemple : GET /api/users/:id/teams
router.get("/:id/teams", auth, getUserTeams);
// Exemple : POST /api/users/:id/teams
router.post("/:id/teams", auth, createTeamViaUserAPI);

export default router;
