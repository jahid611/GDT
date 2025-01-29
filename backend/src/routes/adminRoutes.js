import express from 'express';
import { createAdmin } from '../controllers/adminController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Route pour créer un administrateur
router.post('/create', auth, createAdmin);

export default router;
