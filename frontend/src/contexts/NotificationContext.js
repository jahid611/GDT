import React, { createContext, useContext, useState, useEffect } from "react"
import { getNotifications, markNotificationAsRead } from "../utils/api"

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [currentToast, setCurrentToast] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  const loadNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Erreur lors du marquage de la notification comme lue:", error)
    }
  }

  const showToast = (title, message) => {
    setCurrentToast({ title, message })
  }

  const hideToast = () => {
    setCurrentToast(null)
  }

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev])
    showToast(notification.title, notification.message)
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        currentToast,
        markAsRead,
        showToast,
        hideToast,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications doit être utilisé à l'intérieur d'un NotificationProvider")
  }
  return context
}

