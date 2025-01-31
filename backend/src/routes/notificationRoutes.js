import express from "express"
import { auth } from "../middleware/auth.js" // Import nommé avec accolades
import {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification,
} from "../controllers/notificationController.js"

const router = express.Router()

router.use(auth)

router.get("/", getNotifications)
router.post("/", createNotification)
router.put("/:id/read", markAsRead)
router.delete("/:id", deleteNotification)

export default router

