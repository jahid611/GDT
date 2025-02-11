// controllers/taskController.js
import Task from "../models/Task.js";

// Récupérer toutes les tâches
export const getTasks = async (req, res) => {
  try {
    console.log("Fetching tasks...");
    // Utilisez .lean() pour obtenir des objets JS simples.
    const tasks = await Task.find()
      .lean() // Retourne des objets simples
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");
    console.log(`Found ${tasks.length} tasks`);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Impossible de charger les tâches" });
  }
};

// Créer une nouvelle tâche
export const createTask = async (req, res) => {
  try {
    console.log("Creating task with data:", req.body);
    
    // On s'assure que l'imageUrl est récupérée depuis le corps de la requête.
    const taskData = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || "todo",
      priority: req.body.priority || "medium",
      deadline: req.body.deadline || null,
      estimatedTime: req.body.estimatedTime || 0,
      assignedTo: req.body.assignedTo || null,
      createdBy: req.body.createdBy,
      imageUrl: req.body.imageUrl || "", // Assurez-vous de récupérer la valeur
    };

    const task = await Task.create(taskData);
    await task.populate(["assignedTo", "createdBy"]);
    console.log("Task created:", task);
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: error.message || "Impossible de créer la tâche" });
  }
};

// Mettre à jour une tâche
export const updateTask = async (req, res) => {
  try {
    console.log("Updating task:", req.params.id, req.body);
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
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

// Supprimer une tâche
export const deleteTask = async (req, res) => {
  try {
    console.log("Deleting task:", req.params.id);
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
