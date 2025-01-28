import express from "express"
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  getTaskStats
} from "../controllers/taskController.js"
import auth from "../middleware/auth.js"

const router = express.Router()

/**
 * Routes pour les statistiques
 * GET /api/tasks/stats
 * @description Récupère les statistiques des tâches (complétées, en cours, en retard, temps moyen)
 * @access Privé - Nécessite une authentification
 */
router.get("/stats", auth, getTaskStats)

/**
 * Routes CRUD pour les tâches
 */

/**
 * GET /api/tasks
 * @description Récupère toutes les tâches
 * @access Privé - Nécessite une authentification
 */
router.get("/", auth, getTasks)

/**
 * POST /api/tasks
 * @description Crée une nouvelle tâche
 * @access Privé - Nécessite une authentification
 */
router.post("/", auth, createTask)

/**
 * PUT /api/tasks/:id
 * @description Met à jour une tâche existante
 * @param {string} id - L'ID de la tâche à mettre à jour
 * @access Privé - Nécessite une authentification
 */
router.put("/:id", auth, updateTask)

/**
 * DELETE /api/tasks/:id
 * @description Supprime une tâche existante
 * @param {string} id - L'ID de la tâche à supprimer
 * @access Privé - Nécessite une authentification
 */
router.delete("/:id", auth, deleteTask)

export default router