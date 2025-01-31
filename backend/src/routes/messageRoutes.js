import express from "express"
import { auth } from "../middleware/auth.js"
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
  deleteMessage,
  updateMessage,
} from "../controllers/messageController.js"

const router = express.Router()

// Routes protégées par authentification
router.use(auth)

// Route pour récupérer les messages avec un utilisateur
router.get("/users/:userId/messages", getMessages)

// Route pour envoyer un message à un utilisateur
router.post("/users/:userId/messages", sendMessage)

// Route pour marquer un message comme lu
router.put("/users/:userId/messages/:messageId/read", markMessageAsRead)

// Route pour obtenir le nombre de messages non lus
router.get("/users/:userId/messages/unread/count", getUnreadCount)

// Route pour supprimer un message
router.delete("/users/:userId/messages/:messageId", deleteMessage)

// Route pour modifier un message
router.put("/users/:userId/messages/:messageId", updateMessage)

export default router

