// src/utils/api.js
import axios from "axios";

// ----------------------------------------------------------------------
//                Création de l'instance axios
// ----------------------------------------------------------------------
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "development"
      ? "http://localhost:5000"
      : "https://gdt-fjmj.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 3000000,
  withCredentials: true,
});

// ----------------------------------------------------------------------
//                   Intercepteur de requête (Request)
// ----------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: new Date() };
    console.log("API Request Details:", {
      url: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers,
      data: config.data,
      timestamp: new Date().toISOString(),
      token: token ? "Present" : "Missing",
    });
    return config;
  },
  (error) => {
    console.error("API Request Error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return Promise.reject(new Error("Erreur lors de la préparation de la requête"));
  }
);

// ----------------------------------------------------------------------
//                Intercepteur de réponse (Response)
// ----------------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    console.log("API Response Details:", {
      url: `${response.config.baseURL}${response.config.url}`,
      status: response.status,
      duration: `${duration}ms`,
      dataType: typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : null,
      timestamp: new Date().toISOString(),
    });
    return response;
  },
  (error) => {
    const duration = error.config ? new Date() - error.config.metadata.startTime : null;
    console.error("API Response Error Details:", {
      url: error.config?.url,
      status: error.response?.status,
      duration: duration ? `${duration}ms` : "Unknown",
      data: error.response?.data,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    if (error.code === "ECONNABORTED") {
      throw new Error("La requête a pris trop de temps. Veuillez réessayer.");
    }
    if (!error.response) {
      throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
    }
    if (error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }
    throw error.response?.data || error;
  }
);

// ----------------------------------------------------------------------
//          Fonction de retry avec délai progressif (withRetry)
// ----------------------------------------------------------------------
const withRetry = async (fn, retries = 3, initialDelay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Tentative ${attempt}/${retries}...`);
      }
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(
        `Échec de la tentative ${attempt + 1}/${retries}. Nouvelle tentative dans ${delay / 1000} secondes...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// ----------------------------------------------------------------------
// Cache en mémoire pour les tâches
// ----------------------------------------------------------------------
let tasksCache = null;

// ------------------------
// Authentification
// ------------------------
export const login = async (credentials) => {
  return withRetry(async () => {
    try {
      console.log("Tentative de connexion...");
      const { data } = await api.post("/api/auth/login", credentials);
      if (!data || !data.token) {
        throw new Error("Réponse invalide du serveur");
      }
      localStorage.setItem("token", data.token);
      const userData = {
        ...data.user,
        role: data.user?.role || "user",
      };
      localStorage.setItem("user", JSON.stringify(userData));
      console.log("Connexion réussie:", { user: userData });
      return data;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error("Email ou mot de passe incorrect");
          case 404:
            throw new Error("Compte non trouvé");
          case 429:
            throw new Error("Trop de tentatives de connexion. Veuillez réessayer plus tard.");
          default:
            throw new Error(error.response.data?.message || "Une erreur est survenue lors de la connexion");
        }
      }
      if (error.code === "ECONNABORTED") {
        throw new Error("La connexion a pris trop de temps. Veuillez réessayer.");
      }
      throw new Error("Impossible de se connecter. Vérifiez votre connexion internet.");
    }
  }, 2);
};


export const updateTeam = async (teamId, teamData) => {
  return withRetry(async () => {
    try {
      // Supposons que votre backend expose une route PUT pour mettre à jour une équipe
      const { data } = await api.put(`/api/teams/${teamId}`, teamData);
      console.log("Équipe mise à jour avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      throw new Error(
        error.response?.data?.message || "Impossible de mettre à jour l'équipe"
      );
    }
  });
};

export const deleteTeam = async (teamId) => {
  const res = await fetch(`/api/teams/${teamId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete team");
  }
  return res.json();
};

export const register = async (userData) => {
  return withRetry(async () => {
    try {
      const dataToSend = {
        ...userData,
        role: "user",
      };
      console.log("Création d'un nouveau compte...");
      const { data } = await api.post("/api/auth/register", dataToSend);
      if (!data || !data.token) {
        throw new Error("Réponse invalide du serveur");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...data.user,
          role: data.user.role || "user",
        })
      );
      return data;
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      if (error.response) {
        switch (error.response.status) {
          case 400:
            throw new Error("Données d'inscription invalides");
          case 409:
            throw new Error("Cette adresse email est déjà utilisée");
          default:
            throw new Error(error.response.data?.message || "Erreur lors de l'inscription");
        }
      }
      throw new Error("Impossible de créer le compte. Veuillez réessayer.");
    }
  });
};

export const logout = () => {
  try {
    console.log("Déconnexion...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("Déconnexion réussie");
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    throw new Error("Erreur lors de la déconnexion");
  }
};

// ------------------------
// Gestion des tâches
// ------------------------
// Ici, nous utilisons un cache en mémoire pour ne charger les tâches qu'une seule fois
export const fetchTasks = async () => {
  if (tasksCache) {
    console.log("Utilisation du cache pour les tâches");
    return tasksCache;
  }
  return withRetry(async () => {
    try {
      console.log("Chargement des tâches...");
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }
      const { data } = await api.get("/api/tasks");
      if (!Array.isArray(data)) {
        throw new Error("Format de données invalide reçu du serveur");
      }
      console.log(`${data.length} tâches chargées avec succès`);
      tasksCache = data; // Stocke le résultat dans le cache
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      throw new Error(error.message || "Impossible de charger les tâches");
    }
  });
};

export const createTask = async (taskData) => {
  return withRetry(async () => {
    try {
      console.log("Création d'une nouvelle tâche...");
      const { data } = await api.post("/api/tasks", taskData);
      console.log("Tâche créée avec succès");
      // Optionnel : invalider le cache ici si nécessaire
      tasksCache = null;
      return data;
    } catch (error) {
      console.error("Erreur lors de la création de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible de créer la tâche");
    }
  });
};

export const updateTask = async (taskId, taskData) => {
  return withRetry(async () => {
    try {
      console.log("Mise à jour de la tâche...");
      const { data } = await api.put(`/api/tasks/${taskId}`, taskData);
      console.log("Tâche mise à jour avec succès");
      // Optionnel : invalider le cache ici si nécessaire
      tasksCache = null;
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible de mettre à jour la tâche");
    }
  });
};

export const deleteTask = async (taskId) => {
  return withRetry(async () => {
    try {
      console.log("Suppression de la tâche...");
      const { data } = await api.delete(`/api/tasks/${taskId}`);
      console.log("Tâche supprimée avec succès");
      // Optionnel : invalider le cache ici si nécessaire
      tasksCache = null;
      return data;
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible de supprimer la tâche");
    }
  });
};

// ------------------------
// Gestion des commentaires
// ------------------------
export const addComment = async (taskId, content) => {
  return withRetry(async () => {
    try {
      console.log("Ajout d'un commentaire...");
      const { data } = await api.post(`/api/tasks/${taskId}/comments`, { content });
      console.log("Commentaire ajouté avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      throw new Error(error.response?.data?.message || "Impossible d'ajouter le commentaire");
    }
  });
};

// ------------------------
// Gestion des utilisateurs
// ------------------------
export const getUsers = async () => {
  return withRetry(async () => {
    try {
      console.log("Chargement des utilisateurs...");
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Session expirée");
      }
      const { data } = await api.get("/api/users");
      if (!Array.isArray(data)) {
        throw new Error("Format de données invalide");
      }
      console.log(`${data.length} utilisateurs chargés avec succès`);
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les utilisateurs");
    }
  });
};

export const getUserProfile = async (userId) => {
  return withRetry(async () => {
    try {
      console.log("Chargement du profil utilisateur...");
      const { data } = await api.get(`/api/users/${userId}`);
      console.log("Profil chargé avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger le profil");
    }
  });
};

export const updateUserProfile = async (userId, userData) => {
  return withRetry(async () => {
    try {
      if (!userId) {
        throw new Error("ID utilisateur requis");
      }
      console.log("Mise à jour du profil...");
      const { data } = await api.put(`/api/users/${userId}`, userData);
      console.log("Profil mis à jour avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      throw new Error(error.response?.data?.message || "Impossible de mettre à jour le profil");
    }
  });
};

export const deleteUser = async (userId) => {
  return withRetry(async () => {
    try {
      if (!userId) {
        throw new Error("ID utilisateur requis");
      }
      console.log("Suppression de l'utilisateur...");
      const { data } = await api.delete(`/api/users/${userId}`);
      console.log("Utilisateur supprimé avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      throw new Error(error.response?.data?.message || "Impossible de supprimer l'utilisateur");
    }
  });
};

// ------------------------
// Gestion des notifications
// ------------------------
export const createNotification = async (notificationData) => {
  return withRetry(async () => {
    try {
      console.log("Création d'une notification...");
      const { data } = await api.post("/api/notifications", notificationData);
      console.log("Notification créée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la création de la notification:", error);
      throw new Error(error.response?.data?.message || "Impossible de créer la notification");
    }
  });
};

export const getNotifications = async () => {
  return withRetry(async () => {
    try {
      console.log("Chargement des notifications...");
      const { data } = await api.get("/api/notifications");
      console.log("Notifications chargées avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les notifications");
    }
  });
};

export const markNotificationAsRead = async (notificationId) => {
  return withRetry(async () => {
    try {
      console.log("Marquage de la notification comme lue...");
      const { data } = await api.put(`/api/notifications/${notificationId}/read`);
      console.log("Notification marquée comme lue avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
      throw new Error(error.response?.data?.message || "Impossible de marquer la notification comme lue");
    }
  });
};

// ------------------------
// Statistiques
// ------------------------
export const getTaskStats = async () => {
  return withRetry(async () => {
    try {
      console.log("Chargement des statistiques...");
      const { data } = await api.get("/api/tasks/stats");
      console.log("Statistiques chargées avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les statistiques");
    }
  });
};

// ------------------------
// Messagerie
// ------------------------
export const getMessages = async (userId) => {
  return withRetry(async () => {
    try {
      console.log("Chargement des messages...");
      const { data } = await api.get(`/api/users/${userId}/messages`);
      console.log("Messages chargés avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les messages");
    }
  });
};

export const addMessage = async (userId, messageData) => {
  return withRetry(async () => {
    try {
      console.log("Envoi du message...");
      const { data } = await api.post(`/api/users/${userId}/messages`, messageData);
      console.log("Message envoyé avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      throw new Error(error.response?.data?.message || "Impossible d'envoyer le message");
    }
  });
};

export const markMessageAsRead = async (userId, messageId) => {
  return withRetry(async () => {
    try {
      console.log("Marquage du message comme lu...");
      const { data } = await api.put(`/api/users/${userId}/messages/${messageId}/read`);
      console.log("Message marqué comme lu avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du marquage du message:", error);
      throw new Error(error.response?.data?.message || "Impossible de marquer le message comme lu");
    }
  });
};

export const getUnreadMessagesCount = async (userId) => {
  return withRetry(async () => {
    try {
      console.log("Chargement du nombre de messages non lus...");
      const { data } = await api.get(`/api/users/${userId}/messages/unread/count`);
      console.log("Nombre de messages non lus chargé avec succès");
      return data.count;
    } catch (error) {
      console.error("Erreur lors du chargement du nombre de messages non lus:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger le nombre de messages non lus");
    }
  });
};

// ------------------------
// Gestion des équipes (via l'API /api/teams)
// ------------------------

// Récupération des équipes associées à un utilisateur
export const fetchUserTeams = async (userId) => {
  return withRetry(async () => {
    try {
      console.log(`Fetching teams for user ID: ${userId}`);
      const { data } = await api.get(`/api/users/${userId}/teams`);
      console.log(`${data.length} équipes chargées avec succès`);
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des équipes :", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les équipes");
    }
  });
};

// Créer une équipe via l'API utilisateurs
export const createTeamViaUserAPI = async (teamData) => {
  return withRetry(async () => {
    try {
      console.log("Création d'une nouvelle équipe via API Users...");
      // Le teamData doit contenir le champ leader (ID du leader)
      const { data } = await api.post(`/api/users/${teamData.leader}/teams`, teamData);
      console.log("Équipe créée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la création de l'équipe :", error);
      throw new Error(error.response?.data?.message || "Impossible de créer l'équipe");
    }
  });
};

// N'oubliez pas d'exporter toutes vos fonctions existantes ainsi que celles-ci
export default api;
