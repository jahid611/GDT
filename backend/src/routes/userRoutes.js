import express from "express"
import { getUsers, getUserProfile } from "../controllers/userController.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// Make sure the route for getting all users is properly defined
router.get("/", auth, getUsers)
router.get("/:id", auth, getUserProfile)

export default router

