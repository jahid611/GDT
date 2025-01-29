import Task from "../models/Task.js";

/**
 * Récupérer toutes les tâches
 */
export const getTasks = async (req, res) => {
  try {
    console.log("Fetching tasks...");
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    console.log(`Found ${tasks.length} tasks`);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Impossible de charger les tâches" });
  }
};

/**
 * Créer une nouvelle tâche
 */
export const createTask = async (req, res) => {
  try {
    console.log("Creating task:", req.body);

    // Créer la tâche avec les données fournies
    const task = new Task({
      ...req.body,
      createdBy: req.user.userId, // Utilisateur connecté
    });

    // Sauvegarder dans la base de données
    await task.save();
    console.log("Task created:", task._id);

    // Récupérer la tâche avec les champs liés peuplés
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({ error: error.message || "Impossible de créer la tâche" });
  }
};

/**
 * Mettre à jour une tâche
 */
export const updateTask = async (req, res) => {
  try {
    console.log("Updating task:", req.params.id, req.body);

    // Mettre à jour la tâche et retourner la version mise à jour
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Retourner la tâche mise à jour
      runValidators: true, // Appliquer les validations du modèle
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ error: "Tâche non trouvée" });
    }

    console.log("Task updated:", task._id);
    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(400).json({ error: error.message || "Impossible de mettre à jour la tâche" });
  }
};

/**
 * Supprimer une tâche
 */
export const deleteTask = async (req, res) => {
  try {
    console.log("Deleting task:", req.params.id);

    // Supprimer la tâche
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Tâche non trouvée" });
    }

    console.log("Task deleted:", req.params.id);
    res.status(200).json({ message: "Tâche supprimée avec succès" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: error.message || "Impossible de supprimer la tâche" });
  }
};
