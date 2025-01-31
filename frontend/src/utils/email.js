import emailjs from "@emailjs/browser";
import { getUsers } from "../utils/api"; // Assure-toi que cette fonction est correcte

export const sendAssignmentEmail = async (task) => {
    try {
        const users = await getUsers();
        const assignedUser = users.find((u) => u._id === task.assignedTo);

        if (!assignedUser || !assignedUser.email) {
            console.error("❌ Utilisateur assigné non trouvé ou pas d'e-mail.");
            return;
        }

        const templateParams = {
            to_email: assignedUser.email,
            task_title: task.title || "Titre non défini",
            task_description: task.description || "Description non définie",
            task_deadline: task.deadline
                ? new Date(task.deadline).toISOString()
                : "Aucune date limite",
            task_priority: task.priority || "Non spécifiée",
            task_status: task.status || "Non spécifié",
        };

        console.log("📨 Paramètres envoyés à EmailJS :", templateParams); // Vérifie ici !

        const response = await emailjs.send(
            "service_jhd",  // Ton Service ID
            "template_jhd", // Ton Template ID
            templateParams,
            "FiWAOQdkaG34q5-hc" // Ton User ID
        );

        console.log("✅ E-mail envoyé avec succès :", response);
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'e-mail :", error);
    }
};
