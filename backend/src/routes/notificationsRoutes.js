import express from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Obtenir toutes les notifications de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('taskId', 'title');
    res.json(notifications);
  } catch (err) {
    console.error('Erreur lors de la récupération des notifications:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// @route   POST /api/notifications
// @desc    Créer une nouvelle notification
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('userId', 'ID utilisateur requis').not().isEmpty(),
      check('type', 'Type de notification requis').not().isEmpty(),
      check('message', 'Message requis').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    console.log('Requête reçue pour créer une notification :', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation :', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { userId, type, message, taskId = null } = req.body;

      console.log('Données de la notification :', { userId, type, message, taskId });

      const notification = new Notification({
        userId,
        type,
        message,
        taskId,
        read: false,
        createdAt: new Date(),
        createdBy: req.user.id,
      });

      const savedNotification = await notification.save();
      console.log('Notification sauvegardée :', savedNotification);

      const populatedNotification = await Notification.findById(savedNotification._id)
        .populate('taskId', 'title')
        .populate('createdBy', 'name');
      console.log('Notification peuplée :', populatedNotification);

      res.json(populatedNotification);
    } catch (err) {
      console.error('Erreur lors de la création de la notification :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);


// @route   PUT /api/notifications/:id/read
// @desc    Marquer une notification comme lue
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    notification.read = true;
    notification.readAt = new Date();

    const updatedNotification = await notification.save();

    const populatedNotification = await Notification.findById(updatedNotification._id)
      .populate('taskId', 'title')
      .populate('createdBy', 'name');

    res.json(populatedNotification);
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la notification :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Exportation par défaut
export default router;
