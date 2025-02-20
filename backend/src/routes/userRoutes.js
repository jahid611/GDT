// src/routes/userRoutes.js
import express from "express"
import { getUsers, getUserProfile, deleteUserById } from "../controllers/userController.js"
import auth from "../middleware/auth.js"
import { getUserTeams, createTeamViaUserAPI } from "../controllers/teamController.js"

const router = express.Router()

// Existing user routes
router.get("/", auth, getUsers)
router.get("/:id", auth, getUserProfile)
// We also have a "profile" route, but it's the same logic
router.get("/:id/profile", auth, getUserProfile)

// Team management routes via user
router.get("/:id/teams", auth, getUserTeams)
router.post("/:id/teams", auth, createTeamViaUserAPI)

// ****** NEW: DELETE route to remove a user by ID ******
router.delete("/:id", auth, deleteUserById)

export default router
