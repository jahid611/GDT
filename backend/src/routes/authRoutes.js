import express from "express"
import { login, register, resetPassword } from "../controllers/authController.js"

const router = express.Router()

router.post("/login", login)
router.post("/register", register)
router.post("/reset-password", resetPassword)

export default router

