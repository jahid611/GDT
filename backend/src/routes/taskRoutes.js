import express from "express"
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController.js"
import auth from "../middleware/auth.js"
import {
  upload,
  handleMulterError,
  cleanupOnError,
  validateFileMetadata,
  logFileUpload,
} from "../middleware/uploadMiddleware.js"

const router = express.Router()

// Middleware de débogage pour la taille des requêtes
const debugRequestSize = (req, res, next) => {
  const contentLength = req.headers["content-length"]
  if (contentLength) {
    console.log(`📦 Taille de la requête: ${(Number.parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB`)
  }
  next()
}

// Middleware de vérification de la taille avant upload
const checkRequestSize = (req, res, next) => {
  const contentLength = Number.parseInt(req.headers["content-length"])
  const maxSize = 50 * 1024 * 1024 // 50 MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: "Payload Too Large",
      message: `La taille de la requête (${(contentLength / 1024 / 1024).toFixed(2)} MB) dépasse la limite autorisée (50 MB)`,
      code: "REQUEST_TOO_LARGE",
    })
  }
  next()
}

// Routes avec gestion améliorée des uploads
router.get("/", auth, getTasks)

router.post(
  "/",
  auth,
  debugRequestSize,
  checkRequestSize,
  upload.array("attachments"),
  logFileUpload,
  handleMulterError,
  cleanupOnError,
  validateFileMetadata,
  createTask,
)

router.put(
  "/:id",
  auth,
  debugRequestSize,
  checkRequestSize,
  upload.array("attachments"),
  logFileUpload,
  handleMulterError,
  cleanupOnError,
  validateFileMetadata,
  updateTask,
)

router.delete("/:id", auth, deleteTask)

// Middleware de gestion d'erreur spécifique aux routes
router.use((err, req, res, next) => {
  console.error("❌ Erreur dans taskRoutes:", err)

  if (res.headersSent) {
    return next(err)
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Erreur de validation des données de la tâche",
      details: err.message,
    })
  }

  next(err)
})

export default router

