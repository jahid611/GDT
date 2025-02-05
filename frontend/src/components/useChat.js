import { useState, useEffect, useCallback, useRef } from "react"
import ChatClient from "../lib/ChatClient"

const TYPING_TIMER_LENGTH = 3000

export function useChat(serverUrl, userId, userData = {}) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [rooms, setRooms] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Map())
  const [error, setError] = useState(null)

  const clientRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Initialisation du client
  useEffect(() => {
    const client = new ChatClient(serverUrl)
    clientRef.current = client

    client.on("connected", () => {
      setConnected(true)
      setError(null)
    })

    client.on("disconnected", () => {
      setConnected(false)
    })

    client.on("error", (err) => {
      setError(err.message)
    })

    client.on("message", (message) => {
      setMessages((prev) => [...prev, message])
    })

    client.on("users:updated", (users) => {
      setOnlineUsers(users)
    })

    client.on("room:updated", (updatedRooms) => {
      setRooms(updatedRooms)
    })

    client.on("typing:updated", ({ userId, roomId, isTyping }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev)
        if (isTyping) {
          newMap.set(`${userId}-${roomId}`, {
            userId,
            roomId,
            timestamp: Date.now(),
          })
        } else {
          newMap.delete(`${userId}-${roomId}`)
        }
        return newMap
      })
    })

    // Connexion au serveur
    client.connect(userId, userData).catch((err) => {
      setError(err.message)
    })

    // Nettoyage
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      client.disconnect()
    }
  }, [serverUrl, userId, userData])

  // Envoi de message
  const sendMessage = useCallback(
    (roomId, content) => {
      if (!clientRef.current || !connected) {
        throw new Error("Not connected to chat")
      }
      return clientRef.current.sendMessage(roomId, content)
    },
    [connected],
  )

  // Gestion des salles
  const joinRoom = useCallback(
    (roomId) => {
      if (!clientRef.current || !connected) return
      clientRef.current.joinRoom(roomId)
    },
    [connected],
  )

  const leaveRoom = useCallback(
    (roomId) => {
      if (!clientRef.current || !connected) return
      clientRef.current.leaveRoom(roomId)
    },
    [connected],
  )

  // Gestion de la frappe
  const handleTyping = useCallback(
    (roomId, isTyping) => {
      if (!clientRef.current || !connected) return

      if (isTyping) {
        clientRef.current.startTyping(roomId)

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = setTimeout(() => {
          clientRef.current.stopTyping(roomId)
        }, TYPING_TIMER_LENGTH)
      } else {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        clientRef.current.stopTyping(roomId)
      }
    },
    [connected],
  )

  return {
    connected,
    messages,
    onlineUsers,
    rooms,
    typingUsers,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
    handleTyping,
  }
}

