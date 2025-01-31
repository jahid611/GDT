import axios from "axios"

// Configuration de l'instance axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === "development" ? "http://localhost:5000" : "https://gdt-fjmj.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
})

// Intercepteur de requête amélioré avec logging détaillé
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    config.metadata = { startTime: new Date() }

    console.log("API Request Details:", {
      url: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers,
      data: config.data,
      timestamp: new Date().toISOString(),
      token: token ? "Present" : "Missing",
    })
    return config
  },
  (error) => {
    console.error("API Request Error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
    return Promise.reject(error)
  },
)

// Intercepteur de réponse amélioré avec timing et logging d'erreur détaillé
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime
    console.log("API Response Details:", {
      url: `${response.config.baseURL}${response.config.url}`,
      status: response.status,
      duration: `${duration}ms`,
      dataType: typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : null,
      timestamp: new Date().toISOString(),
    })
    return response
  },
  (error) => {
    const duration = error.config ? new Date() - error.config.metadata.startTime : null
    console.error("API Response Error Details:", {
      url: error.config?.url,
      status: error.response?.status,
      duration: duration ? `${duration}ms` : "Unknown",
      data: error.response?.data,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })

    if (error.code === "ECONNABORTED") {
      throw new Error("La requête a pris trop de temps à répondre. Veuillez réessayer.")
    }

    if (!error.response) {
      throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.")
    }

    if (error.response.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
      throw new Error("Session expirée. Veuillez vous reconnecter.")
    }

    throw error.response?.data || error
  },
)

// Fonction de retry avec délai progressif
const withRetry = async (fn, retries = 3, initialDelay = 1000) => {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Tentative ${attempt}/${retries}...`)
      }
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === retries) break

      const delay = initialDelay * Math.pow(2, attempt)
      console.log(
        `Échec de la tentative ${attempt + 1}/${retries}. Nouvelle tentative dans ${delay / 1000} secondes...`,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

// Points d'API pour les tâches avec meilleure gestion d'erreur
export const fetchTasks = async () => {
  return withRetry(async () => {
    try {
      console.log("Début du chargement des tâches...")
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.")
      }

      const { data } = await api.get("/api/tasks")

      if (!Array.isArray(data)) {
        throw new Error("Format de données invalide reçu du serveur")
      }

      console.log(`${data.length} tâches chargées avec succès`)
      return data
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw new Error(error.message || "Impossible de charger les tâches. Veuillez réessayer.")
    }
  })
}

export const createTask = async (taskData) => {
  return withRetry(async () => {
    try {
      console.log("Creating task:", taskData)
      const { data } = await api.post("/api/tasks", taskData)
      console.log("Task created successfully:", data)
      return data
    } catch (error) {
      console.error("Error creating task:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const updateTask = async (taskId, taskData) => {
  return withRetry(async () => {
    try {
      console.log("Updating task:", { taskId, taskData })
      const { data } = await api.put(`/api/tasks/${taskId}`, taskData)
      console.log("Task updated successfully:", data)
      return data
    } catch (error) {
      console.error("Error updating task:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const deleteTask = async (taskId) => {
  return withRetry(async () => {
    try {
      console.log("Deleting task:", taskId)
      const { data } = await api.delete(`/api/tasks/${taskId}`)
      console.log("Task deleted successfully:", data)
      return data
    } catch (error) {
      console.error("Error deleting task:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const addComment = async (taskId, content) => {
  return withRetry(async () => {
    try {
      console.log("Adding comment:", { taskId, content })
      const { data } = await api.post(`/api/tasks/${taskId}/comments`, { content })
      console.log("Comment added successfully:", data)
      return data
    } catch (error) {
      console.error("Error adding comment:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const getUsers = async () => {
  return withRetry(async () => {
    try {
      console.log("📡 Fetching users from API...");
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("❌ Token d'authentification manquant");
      }

      const { data } = await api.get("/api/users");

      if (!Array.isArray(data)) {
        console.error("❌ Format de réponse invalide :", data);
        throw new Error("Format de réponse invalide");
      }

      console.log(`✅ Successfully fetched ${data.length} users`, data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      const errorMessage = error.response?.data?.error || error.message || "Impossible de charger les utilisateurs";
      throw new Error(errorMessage);
    }
  }, 3);
};


export const createNotification = async (notificationData) => {
  return withRetry(async () => {
    try {
      console.log("Creating notification:", notificationData)
      const { data } = await api.post("/api/notifications", notificationData)
      console.log("Notification created successfully:", data)
      return data
    } catch (error) {
      console.error("Error creating notification:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const getUserProfile = async (userId) => {
  return withRetry(async () => {
    try {
      console.log("Fetching user profile:", userId)
      const { data } = await api.get(`/api/users/${userId}`)
      console.log("User profile fetched successfully:", data)
      return data
    } catch (error) {
      console.error("Error fetching user profile:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const updateUserProfile = async (userId, userData) => {
  return withRetry(async () => {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const cleanUserId = userId.toString().trim()

      console.log("Updating user profile:", { userId: cleanUserId, userData })
      const { data } = await api.put(`/api/users/${cleanUserId}`, userData)
      console.log("User profile updated successfully:", data)
      return data
    } catch (error) {
      console.error("Error updating user profile:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId,
        userData,
      })
      throw error
    }
  })
}

export const login = async (credentials) => {
  return withRetry(async () => {
    try {
      console.log("Attempting login...")
      const { data } = await api.post("/api/auth/login", credentials)
      if (data.token) {
        console.log("Login response:", data) // Log complet de la réponse
        localStorage.setItem("token", data.token)
        // S'assurer que le rôle est explicitement stocké
        const userData = {
          ...data.user,
          role: data.user.role || "user", // Utiliser "user" comme fallback
        }
        localStorage.setItem("user", JSON.stringify(userData))
        console.log("Stored user data:", userData)
      }
      return data
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  })
}

export const register = async (userData) => {
  return withRetry(async () => {
    try {
      // Force le rôle à "user" pour tous les nouveaux comptes
      const dataToSend = {
        ...userData,
        role: "user",
      }

      console.log("Registering new user")
      const { data } = await api.post("/api/auth/register", dataToSend)

      if (data.token) {
        console.log("Registration successful")
        localStorage.setItem("token", data.token)
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...data.user,
            role: data.user.role,
          }),
        )
      }
      return data
    } catch (error) {
      console.error("Registration error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const logout = () => {
  try {
    console.log("Logging out...")
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    console.log("Logout successful")
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

export const getTaskStats = async () => {
  return withRetry(async () => {
    try {
      console.log("Fetching task statistics...")
      const { data } = await api.get("/api/tasks/stats")
      console.log("Task statistics fetched successfully:", data)
      return data
    } catch (error) {
      console.error("Error fetching task statistics:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const getNotifications = async () => {
  return withRetry(async () => {
    try {
      console.log("Fetching notifications...")
      const { data } = await api.get("/api/notifications")
      console.log("Notifications fetched successfully:", data)
      return data
    } catch (error) {
      console.error("Error fetching notifications:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const markNotificationAsRead = async (notificationId) => {
  return withRetry(async () => {
    try {
      console.log("Marking notification as read:", notificationId)
      const { data } = await api.put(`/api/notifications/${notificationId}/read`)
      console.log("Notification marked as read successfully:", data)
      return data
    } catch (error) {
      console.error("Error marking notification as read:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const deleteUser = async (userId) => {
  return withRetry(async () => {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const cleanUserId = userId.toString().trim()

      console.log("Deleting user:", { userId: cleanUserId })
      const { data } = await api.delete(`/api/users/${cleanUserId}`)
      console.log("User deleted successfully")
      return data
    } catch (error) {
      console.error("Error deleting user:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId,
      })
      throw error
    }
  })
}

// Nouvelles fonctions pour la messagerie en utilisant la structure users/:userId/messages
export const getMessages = async (userId) => {
  return withRetry(async () => {
    try {
      console.log("Fetching messages...", { userId })
      const { data } = await api.get(`/api/users/${userId}/messages`)
      console.log("Messages fetched successfully:", data)
      return data
    } catch (error) {
      console.error("Error fetching messages:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const addMessage = async (userId, messageData) => {
  return withRetry(async () => {
    try {
      console.log("Sending message:", { userId, messageData })
      const { data } = await api.post(`/api/users/${userId}/messages`, messageData)
      console.log("Message sent successfully:", data)
      return data
    } catch (error) {
      console.error("Error sending message:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const markMessageAsRead = async (userId, messageId) => {
  return withRetry(async () => {
    try {
      console.log("Marking message as read:", { userId, messageId })
      const { data } = await api.put(`/api/users/${userId}/messages/${messageId}/read`)
      console.log("Message marked as read successfully:", data)
      return data
    } catch (error) {
      console.error("Error marking message as read:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const getUnreadMessagesCount = async (userId) => {
  return withRetry(async () => {
    try {
      console.log("Fetching unread messages count...", { userId })
      const { data } = await api.get(`/api/users/${userId}/messages/unread/count`)
      console.log("Unread messages count fetched successfully:", data)
      return data.count
    } catch (error) {
      console.error("Error fetching unread messages count:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export default api

