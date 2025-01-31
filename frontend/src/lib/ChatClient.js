import io from "socket.io-client"
import EventEmitter from "events"

class ChatClient extends EventEmitter {
  constructor(url) {
    super()
    this.url = url
    this.socket = null
    this.connected = false
    this.rooms = new Map()
    this.users = new Map()
  }

  connect(userId, userData = {}) {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        auth: { userId, ...userData },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      this.socket.on("connect", () => {
        this.connected = true
        this.emit("connected")
        resolve()
      })

      this.socket.on("disconnect", () => {
        this.connected = false
        this.emit("disconnected")
      })

      this.socket.on("error", (error) => {
        this.emit("error", error)
        reject(error)
      })

      // Gestion des messages
      this.socket.on("message", (message) => {
        this.emit("message", message)
      })

      // Gestion des utilisateurs en ligne
      this.socket.on("users:online", (users) => {
        this.users = new Map(users.map((user) => [user.id, user]))
        this.emit("users:updated", Array.from(this.users.values()))
      })

      // Gestion des salles de chat
      this.socket.on("room:joined", (room) => {
        this.rooms.set(room.id, room)
        this.emit("room:updated", Array.from(this.rooms.values()))
      })

      this.socket.on("room:left", (roomId) => {
        this.rooms.delete(roomId)
        this.emit("room:updated", Array.from(this.rooms.values()))
      })

      // Gestion des indicateurs de frappe
      this.socket.on("typing:start", ({ userId, roomId }) => {
        this.emit("typing:updated", { userId, roomId, isTyping: true })
      })

      this.socket.on("typing:stop", ({ userId, roomId }) => {
        this.emit("typing:updated", { userId, roomId, isTyping: false })
      })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
      this.rooms.clear()
      this.users.clear()
    }
  }

  // Méthodes pour les messages
  sendMessage(roomId, content) {
    if (!this.connected) throw new Error("Client not connected")

    const message = {
      id: Date.now().toString(),
      roomId,
      content,
      timestamp: new Date().toISOString(),
    }

    this.socket.emit("message:send", message)
    return message
  }

  // Méthodes pour les salles
  joinRoom(roomId) {
    if (!this.connected) throw new Error("Client not connected")
    this.socket.emit("room:join", roomId)
  }

  leaveRoom(roomId) {
    if (!this.connected) throw new Error("Client not connected")
    this.socket.emit("room:leave", roomId)
  }

  // Méthodes pour les indicateurs de frappe
  startTyping(roomId) {
    if (!this.connected) throw new Error("Client not connected")
    this.socket.emit("typing:start", { roomId })
  }

  stopTyping(roomId) {
    if (!this.connected) throw new Error("Client not connected")
    this.socket.emit("typing:stop", { roomId })
  }

  // Méthodes utilitaires
  getOnlineUsers() {
    return Array.from(this.users.values())
  }

  getRooms() {
    return Array.from(this.rooms.values())
  }

  isConnected() {
    return this.connected
  }
}

export default ChatClient

