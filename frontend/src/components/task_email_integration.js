import emailjs from "emailjs-com";
import { getUsers } from "./api"; // Assurez-vous que cette fonction récupère correctement les utilisateurs

export const sendEmailToAssignedUser = async (task) => {
  try {
    console.log("📡 Récupération des utilisateurs pour envoi d'email...");
    const users = await getUsers(); // Récupérer la liste des utilisateurs

    if (!users || users.length === 0) {
      console.error("❌ Aucun utilisateur trouvé pour l'envoi d'email.");
      return;
    }

    // Trouver l'utilisateur assigné à la tâche
    const assignedUser = users.find((user) => user._id === task.assignedTo);

    if (!assignedUser || !assignedUser.email) {
      console.error("❌ Utilisateur assigné introuvable ou sans email.");
      return;
    }

    console.log("👤 Utilisateur assigné :", assignedUser);

    // Préparer les paramètres du modèle d'email
    const templateParams = {
      task_title: task.title || "Titre non défini",
      task_description: task.description || "Description non définie",
      task_priority: task.priority || "Non spécifiée",
      task_status: task.status || "Non spécifié",
      task_deadline: task.deadline
        ? new Date(task.deadline).toISOString()
        : "Aucune date limite",
      to_email: assignedUser.email,
    };

    // Envoyer l'email via EmailJS
    const response = await emailjs.send(
      "service_jhd", // Service ID (remplace par le tien)
      "template_jhd", // Template ID (remplace par le tien)
      templateParams,
      "FiWAOQdkaG34q5-hc" // Clé publique (remplace par la tienne)
    );

    console.log(`✅ Email envoyé à ${assignedUser.email} avec succès :`, response);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
  }
};
