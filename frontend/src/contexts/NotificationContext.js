import React, { createContext, useContext, useState, useEffect } from 'react'
import { getNotifications, markNotificationAsRead } from '../utils/api'
import { useAuth } from './AuthContext'

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
      setUnreadCount(data.filter(n => !n.read).length)
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    }
  }

  const showToast = (title, message, type = 'default') => {
    // Garder la fonction showToast existante
  }

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
    if (notification.userId === user?.id) {
      setCurrentNotification(notification)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error)
    }
  }

  const dismissCurrentNotification = () => {
    setCurrentNotification(null)
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        currentNotification,
        showToast,
        addNotification,
        markAsRead,
        dismissCurrentNotification,
        loadNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)