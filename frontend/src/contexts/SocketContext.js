import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"
import { v4 as uuidv4 } from "uuid"

const SocketContext = createContext()

// Générer un ID unique pour cet onglet
const TAB_ID = uuidv4()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) {
      console.log("No user ID, skipping socket connection")
      return
    }

    console.log("Attempting socket connection...")
    const newSocket = io("http://localhost:5000", {
      auth: {
        userId: user.id,
        tabId: TAB_ID,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log(`Socket connected successfully - Tab: ${TAB_ID}`)
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      console.log(`Socket disconnected - Tab: ${TAB_ID}`)
      setIsConnected(false)
      setOnlineUsers(new Set())
    })

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message)
    })

    newSocket.on("users:online", (users) => {
      console.log("Online users updated:", users)
      setOnlineUsers(new Set(users))
    })

    setSocket(newSocket)

    return () => {
      console.log(`Cleaning up socket connection - Tab: ${TAB_ID}`)
      newSocket.disconnect()
    }
  }, [user?.id])

  const emit = (event, data) => {
    if (socket) {
      socket.emit(event, data)
    }
  }

  return <SocketContext.Provider value={{ socket, isConnected, onlineUsers, emit }}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

