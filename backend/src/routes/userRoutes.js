import express from "express"
import { protect, admin } from '../middleware/authMiddleware.js'
import { 
  getUserProfile,
  getUsers,
  updateProfile
} from '../controllers/userController.js'

const router = express.Router()

// Routes protégées
router.get('/profile', protect, getUserProfile)
router.put('/profile', protect, updateProfile)

// Routes admin
router.get('/', protect, admin, getUsers)

export default router