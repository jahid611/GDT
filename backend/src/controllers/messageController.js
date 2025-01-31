import Message from "../models/Message.js"
import User from "../models/User.js"
import { ApiError } from "../utils/errors.js"

// Récupérer les messages entre deux utilisateurs
export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.id

    // Vérifier que l'utilisateur existe
    const recipient = await User.findById(userId)
    if (!recipient) {
      throw new ApiError(404, "Utilisateur non trouvé")
    }

    // Récupérer les messages dans les deux sens
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: userId },
        { senderId: userId, recipientId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "username email")
      .populate("recipientId", "username email")

    // Marquer les messages reçus comme lus
    await Message.updateMany(
      {
        senderId: userId,
        recipientId: currentUserId,
        read: false,
      },
      { read: true },
    )

    res.status(200).json(messages)
  } catch (error) {
    next(error)
  }
}

// Envoyer un message
export const sendMessage = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { content } = req.body
    const senderId = req.user.id

    // Vérifier que le destinataire existe
    const recipient = await User.findById(userId)
    if (!recipient) {
      throw new ApiError(404, "Destinataire non trouvé")
    }

    // Créer le message
    const message = await Message.create({
      content,
      senderId,
      recipientId: userId,
      senderEmail: req.user.email,
      recipientEmail: recipient.email,
    })

    // Peupler les champs utilisateur
    await message.populate("senderId", "username email")
    await message.populate("recipientId", "username email")

    res.status(201).json(message)
  } catch (error) {
    next(error)
  }
}

// Marquer un message comme lu
export const markMessageAsRead = async (req, res, next) => {
  try {
    const { userId, messageId } = req.params
    const currentUserId = req.user.id

    const message = await Message.findOne({
      _id: messageId,
      recipientId: currentUserId,
      senderId: userId,
    })

    if (!message) {
      throw new ApiError(404, "Message non trouvé")
    }

    message.read = true
    await message.save()

    res.status(200).json(message)
  } catch (error) {
    next(error)
  }
}

// Obtenir le nombre de messages non lus
export const getUnreadCount = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.id

    const count = await Message.countDocuments({
      senderId: userId,
      recipientId: currentUserId,
      read: false,
    })

    res.status(200).json({ count })
  } catch (error) {
    next(error)
  }
}

// Supprimer un message
export const deleteMessage = async (req, res, next) => {
  try {
    const { userId, messageId } = req.params
    const currentUserId = req.user.id

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ senderId: currentUserId }, { recipientId: currentUserId }],
    })

    if (!message) {
      throw new ApiError(404, "Message non trouvé")
    }

    // Vérifier que l'utilisateur est l'expéditeur
    if (message.senderId.toString() !== currentUserId) {
      throw new ApiError(403, "Vous n'êtes pas autorisé à supprimer ce message")
    }

    await message.remove()
    res.status(200).json({ message: "Message supprimé avec succès" })
  } catch (error) {
    next(error)
  }
}

// Modifier un message
export const updateMessage = async (req, res, next) => {
  try {
    const { userId, messageId } = req.params
    const { content } = req.body
    const currentUserId = req.user.id

    const message = await Message.findOne({
      _id: messageId,
      senderId: currentUserId,
    })

    if (!message) {
      throw new ApiError(404, "Message non trouvé")
    }

    // Vérifier que le message n'a pas plus de 5 minutes
    const fiveMinutes = 5 * 60 * 1000
    if (Date.now() - message.createdAt > fiveMinutes) {
      throw new ApiError(403, "Le message ne peut plus être modifié après 5 minutes")
    }

    message.content = content
    message.edited = true
    await message.save()

    res.status(200).json(message)
  } catch (error) {
    next(error)
  }
}

