import { createContext, useContext, useState, useEffect } from "react"
import { getNotifications, markNotificationAsRead } from "../utils/api"
import { useAuth } from "./AuthContext"

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentNotification, setCurrentNotification] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
      updateUnreadCount(data)
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  const updateUnreadCount = (notifs) => {
    const count = notifs.filter((n) => !n.read).length
    setUnreadCount(count)
  }

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
      updateUnreadCount(notifications)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const showToast = (title, description, variant = "default") => {
    // For chat notifications, we want more control
    if (variant === "chat") {
      setCurrentNotification({
        id: Date.now(),
        title,
        description,
        type: "chat",
        actionLabel: "View conversation",
        conversationId: description.conversationId,
      })
    } else {
      setCurrentNotification({
        id: Date.now(),
        title,
        message: description,
        type: variant,
      })
    }

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissCurrentNotification()
    }, 5000)
  }

  const dismissCurrentNotification = () => {
    setCurrentNotification(null)
  }

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev])
    updateUnreadCount([notification, ...notifications])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        currentNotification,
        showToast,
        dismissCurrentNotification,
        markAsRead,
        addNotification,
        loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

