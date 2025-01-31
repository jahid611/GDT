import Notification from "../models/Notification.js"
import { ApiError } from "../utils/errors.js"

// Récupérer toutes les notifications d'un utilisateur
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("taskId", "title")

    res.status(200).json(notifications)
  } catch (error) {
    next(error)
  }
}

// Créer une nouvelle notification
export const createNotification = async (req, res, next) => {
  try {
    const { title, message, type, taskId, userId } = req.body

    const notification = await Notification.create({
      title,
      message,
      type,
      taskId,
      userId: userId || req.user.id,
    })

    await notification.populate("taskId", "title")

    res.status(201).json(notification)
  } catch (error) {
    next(error)
  }
}

// Marquer une notification comme lue
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })

    if (!notification) {
      throw new ApiError(404, "Notification non trouvée")
    }

    notification.read = true
    await notification.save()

    res.status(200).json(notification)
  } catch (error) {
    next(error)
  }
}

// Supprimer une notification
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })

    if (!notification) {
      throw new ApiError(404, "Notification non trouvée")
    }

    await notification.remove()

    res.status(200).json({ message: "Notification supprimée avec succès" })
  } catch (error) {
    next(error)
  }
}

