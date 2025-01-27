import axios from "axios"

const api = axios.create({
  baseURL: "https://gdt-fjmj.onrender.com", // URL déployée de votre backend
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});


// Enhanced request interceptor with more detailed logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add timestamp to track request duration
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

// Enhanced response interceptor with timing and detailed error logging
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

    // Enhanced error handling
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

// Enhanced retry functionality with progressive delay
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

// Enhanced task endpoints with better error messages
export const fetchTasks = async () => {
  return withRetry(async () => {
    try {
      console.log("Début du chargement des tâches...")
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.")
      }

      const { data } = await api.get("/api/tasks")

      // Validate response data
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

// User endpoints with enhanced error handling and retry
export const getUsers = async () => {
  return withRetry(async () => {
    try {
      console.log("Fetching users from API...")
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Token d'authentification manquant")
      }

      const { data } = await api.get("/api/users")

      // Validate the response data
      if (!Array.isArray(data)) {
        console.error("Invalid users response format:", data)
        throw new Error("Format de réponse invalide")
      }

      console.log(`Successfully fetched ${data.length} users`)
      return data
    } catch (error) {
      console.error("Error fetching users:", error)
      const errorMessage = error.response?.data?.error || error.message || "Impossible de charger les utilisateurs"
      throw new Error(errorMessage)
    }
  }, 3) // Try up to 3 times
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
      console.log("Updating user profile:", { userId, userData })
      const { data } = await api.put(`/api/users/${userId}`, userData)
      console.log("User profile updated successfully:", data)
      return data
    } catch (error) {
      console.error("Error updating user profile:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

// Auth endpoints with enhanced error handling and retry
export const login = async (credentials) => {
  return withRetry(async () => {
    try {
      console.log("Attempting login...")
      const { data } = await api.post("/api/auth/login", credentials)
      if (data.token) {
        console.log("Login successful, token received")
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
      } else {
        console.error("No token received in login response")
      }
      return data
    } catch (error) {
      console.error("Login error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw error
    }
  })
}

export const register = async (userData) => {
  return withRetry(async () => {
    try {
      console.log("Attempting registration...")
      const { data } = await api.post("/api/auth/register", userData)
      if (data.token) {
        console.log("Registration successful, token received")
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
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

// Stats endpoints with enhanced error handling and retry
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

// Notification endpoints with enhanced error handling and retry
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

export default api

