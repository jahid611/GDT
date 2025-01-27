import express from "express";
import { getUsers, getUserProfile } from "../controllers/userController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Route pour obtenir tous les utilisateurs
router.get("/", auth, getUsers);

// Route pour obtenir le profil d'un utilisateur par ID
router.get("/:id", auth, getUserProfile);

export default router;
