// src/utils/api.js
import axios from "axios";

// Configuration de l'instance axios
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "development"
      ? "http://localhost:5000"
      : "https://gdt-fjmj.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

// Intercepteur de requête avec logging détaillé
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

// Intercepteur de réponse avec timing et logging d'erreur détaillé
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

// Fonction de retry avec délai progressif
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

// --- Authentification ---
export const login = async (credentials) => {
  return withRetry(async () => {
    try {
      console.log("Tentative de connexion...");
      const { data } = await api.post("/api/auth/login", credentials);
      if (!data || !data.token) {
        throw new Error("Réponse invalide du serveur");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log("Connexion réussie:", { user: data.user });
      return data;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw new Error(error.response?.data?.message || "Échec de la connexion");
    }
  });
};

export const register = async (userData) => {
  return withRetry(async () => {
    try {
      const { data } = await api.post("/api/auth/register", userData);
      return data;
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      throw new Error(error.response?.data?.message || "Échec de l'inscription");
    }
  });
};

export const logout = async () => {
  return withRetry(async () => {
    try {
      await api.post("/api/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      throw new Error(error.response?.data?.message || "Échec de la déconnexion");
    }
  });
};

// --- Utilisateurs ---
export const getUsers = async () => {
  return withRetry(async () => {
    try {
      const { data } = await api.get("/api/users");
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      throw new Error(error.response?.data?.message || "Impossible de récupérer les utilisateurs");
    }
  });
};

export const getUserProfile = async (userId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.get(`/api/users/${userId}/profile`);
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      throw new Error(error.response?.data?.message || "Impossible de récupérer le profil");
    }
  });
};

export const updateUserProfile = async (userId, userData) => {
  return withRetry(async () => {
    try {
      if (!userId) {
        throw new Error("ID utilisateur requis");
      }
      const { data } = await api.put(`/api/users/${userId}`, userData);
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
      const { data } = await api.delete(`/api/users/${userId}`);
      return data;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      throw new Error(error.response?.data?.message || "Impossible de supprimer l'utilisateur");
    }
  });
};

// --- Tâches ---
export const fetchTasks = async (filters = {}) => {
  return withRetry(async () => {
    try {
      const { data } = await api.get("/api/tasks", { params: filters });
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les tâches");
    }
  });
};

export const createTask = async (taskData) => {
  return withRetry(async () => {
    try {
      const { data } = await api.post("/api/tasks", taskData);
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
      const { data } = await api.put(`/api/tasks/${taskId}`, taskData);
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
      const { data } = await api.delete(`/api/tasks/${taskId}`);
      return data;
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible de supprimer la tâche");
    }
  });
};

// --- Notifications ---
export const getNotifications = async () => {
  return withRetry(async () => {
    try {
      const { data } = await api.get("/api/notifications");
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      throw new Error(error.response?.data?.message || "Impossible de récupérer les notifications");
    }
  });
};

export const markNotificationAsRead = async (notificationId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.put(`/api/notifications/${notificationId}/read`);
      return data;
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
      throw new Error(error.response?.data?.message || "Impossible de marquer la notification comme lue");
    }
  });
};

// --- Équipes ---
export const fetchUserTeams = async (userId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.get(`/api/users/${userId}/teams`);
      console.log(`${data.length} équipes chargées avec succès`);
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des équipes:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les équipes");
    }
  });
};

export const createTeamViaUserAPI = async (leaderId, teamData) => {
  return withRetry(async () => {
    try {
      // Utilisation de l'ID leader dans l'URL
      const { data } = await api.post(`/api/users/${leaderId}/teams`, teamData);
      console.log("Équipe créée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la création de l'équipe:", error);
      throw new Error(error.response?.data?.message || "Impossible de créer l'équipe");
    }
  });
};

export const updateTeam = async (teamId, teamData) => {
  return withRetry(async () => {
    try {
      const { data } = await api.put(`/api/teams/${teamId}`, teamData);
      console.log("Équipe mise à jour avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      throw new Error(error.response?.data?.message || "Impossible de mettre à jour l'équipe");
    }
  });
};

export const deleteTeam = async (teamId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.delete(`/api/teams/${teamId}`);
      console.log("Équipe supprimée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'équipe:", error);
      throw new Error(error.response?.data?.message || "Impossible de supprimer l'équipe");
    }
  });
};

// --- Membres d'équipe ---
export const addTeamMember = async (teamId, userId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.post(`/api/teams/${teamId}/members`, { userId });
      console.log("Membre ajouté avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de l'ajout du membre:", error);
      throw new Error(error.response?.data?.message || "Impossible d'ajouter le membre");
    }
  });
};

export const removeTeamMember = async (teamId, userId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.delete(`/api/teams/${teamId}/members/${userId}`);
      console.log("Membre retiré avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du retrait du membre:", error);
      throw new Error(error.response?.data?.message || "Impossible de retirer le membre");
    }
  });
};

// --- Tâches d'équipe ---
export const fetchTeamTasks = async (teamId) => {
  return withRetry(async () => {
    if (!teamId) {
      throw new Error("teamId is undefined");
    }
    try {
      const { data } = await api.get(`/api/teams/${teamId}/tasks`);
      console.log(`${data.length} tâches chargées avec succès pour l'équipe ${teamId}`);
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les tâches");
    }
  });
};

export const createTeamTask = async (teamId, taskData) => {
  return withRetry(async () => {
    if (!teamId) {
      throw new Error("teamId is undefined");
    }
    try {
      const { data } = await api.post(`/api/teams/${teamId}/tasks`, {
        ...taskData,
        teamId: teamId,
      });
      console.log("Tâche créée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la création de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible de créer la tâche");
    }
  });
};

export const updateTeamTask = async (teamId, taskId, taskData) => {
  return withRetry(async () => {
    try {
      const { data } = await api.put(`/api/teams/${teamId}/tasks/${taskId}`, taskData);
      console.log("Tâche mise à jour avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible de mettre à jour la tâche");
    }
  });
};

export const deleteTeamTask = async (teamId, taskId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.delete(`/api/teams/${teamId}/tasks/${taskId}`);
      console.log("Tâche supprimée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible de supprimer la tâche");
    }
  });
};

export const assignTask = async (teamId, taskId, userId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.post(`/api/teams/${teamId}/tasks/${taskId}/assign`, { userId });
      console.log("Tâche assignée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de l'assignation de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible d'assigner la tâche");
    }
  });
};

export const unassignTask = async (teamId, taskId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.post(`/api/teams/${teamId}/tasks/${taskId}/unassign`);
      console.log("Tâche désassignée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la désassignation de la tâche:", error);
      throw new Error(error.response?.data?.message || "Impossible de désassigner la tâche");
    }
  });
};

export const addTaskComment = async (teamId, taskId, comment) => {
  return withRetry(async () => {
    try {
      const { data } = await api.post(`/api/teams/${teamId}/tasks/${taskId}/comments`, { content: comment });
      console.log("Commentaire ajouté avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      throw new Error(error.response?.data?.message || "Impossible d'ajouter le commentaire");
    }
  });
};

export const deleteTaskComment = async (teamId, taskId, commentId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.delete(`/api/teams/${teamId}/tasks/${taskId}/comments/${commentId}`);
      console.log("Commentaire supprimé avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
      throw new Error(error.response?.data?.message || "Impossible de supprimer le commentaire");
    }
  });
};

export const uploadTaskAttachment = async (teamId, taskId, file) => {
  return withRetry(async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post(`/api/teams/${teamId}/tasks/${taskId}/attachments`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Pièce jointe uploadée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de l'upload de la pièce jointe:", error);
      throw new Error(error.response?.data?.message || "Impossible d'uploader la pièce jointe");
    }
  });
};

export const deleteTaskAttachment = async (teamId, taskId, attachmentId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.delete(`/api/teams/${teamId}/tasks/${taskId}/attachments/${attachmentId}`);
      console.log("Pièce jointe supprimée avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors de la suppression de la pièce jointe:", error);
      throw new Error(error.response?.data?.message || "Impossible de supprimer la pièce jointe");
    }
  });
};

export const fetchUserNotifications = async () => {
  return withRetry(async () => {
    try {
      const { data } = await api.get("/api/notifications");
      console.log(`${data.length} notifications chargées avec succès`);
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les notifications");
    }
  });
};

export const fetchTeamStats = async (teamId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.get(`/api/teams/${teamId}/stats`);
      console.log("Statistiques d'équipe chargées avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les statistiques");
    }
  });
};

export const fetchUserStats = async (userId) => {
  return withRetry(async () => {
    try {
      const { data } = await api.get(`/api/users/${userId}/stats`);
      console.log("Statistiques utilisateur chargées avec succès");
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      throw new Error(error.response?.data?.message || "Impossible de charger les statistiques");
    }
  });
};

export default api;
