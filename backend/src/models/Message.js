import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Le contenu du message est requis"],
      trim: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    edited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Index pour améliorer les performances des requêtes
messageSchema.index({ senderId: 1, recipientId: 1 })
messageSchema.index({ recipientId: 1, read: 1 })
messageSchema.index({ createdAt: 1 })

const Message = mongoose.model("Message", messageSchema)

export default Message

