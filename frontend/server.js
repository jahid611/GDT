const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Stockage en mémoire pour les messages
const messages = []
const connectedUsers = new Map()

// Socket.IO
io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId

  if (!userId) {
    socket.disconnect()
    return
  }

  // Store new connection
  connectedUsers.set(userId, socket)
  console.log(`User connected: ${userId}`)

  // Broadcast online users
  const broadcastOnlineUsers = () => {
    io.emit("users:online", Array.from(connectedUsers.keys()))
  }

  broadcastOnlineUsers()

  // Handle messages
  socket.on("new_message", async ({ message }) => {
    messages.push(message)

    // Send to recipient if online
    const recipientSocket = connectedUsers.get(message.recipientId)
    if (recipientSocket) {
      recipientSocket.emit("new_message", { message })
    }

    // Send confirmation back to sender
    socket.emit("new_message", { message })
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    if (connectedUsers.get(userId) === socket) {
      connectedUsers.delete(userId)
      console.log(`User disconnected: ${userId}`)
      broadcastOnlineUsers()
    }
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

