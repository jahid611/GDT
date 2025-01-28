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

/**
 * Obtenir les statistiques des tâches
 */
export const getTaskStats = async (req, res) => {
  try {
    console.log("📊 Calculating task statistics...");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    console.log("📅 Period:", {
      from: startOfMonth.toISOString(),
      to: now.toISOString()
    });

    const [completed, inProgress, overdue, allCompletedTasks] = await Promise.all([
      // Tâches terminées ce mois
      Task.countDocuments({
        status: 'done',
        completedAt: { $gte: startOfMonth }
      }).then(count => {
        console.log(`✅ Completed tasks this month: ${count}`);
        return count;
      }),
      
      // Tâches en cours
      Task.countDocuments({
        status: { $in: ['in_progress', 'review'] }
      }).then(count => {
        console.log(`🔄 Tasks in progress: ${count}`);
        return count;
      }),
      
      // Tâches en retard
      Task.countDocuments({
        status: { $ne: 'done' },
        deadline: { $lt: now }
      }).then(count => {
        console.log(`⚠️ Overdue tasks: ${count}`);
        return count;
      }),
      
      // Toutes les tâches terminées pour calculer le temps moyen
      Task.find({
        status: 'done',
        completedAt: { $exists: true },
        createdAt: { $exists: true }
      }).then(tasks => {
        console.log(`📈 Total completed tasks for average calculation: ${tasks.length}`);
        return tasks;
      })
    ]);

    // Calculer le temps moyen de complétion
    let averageCompletionTime = 0;
    if (allCompletedTasks.length > 0) {
      const totalCompletionTime = allCompletedTasks.reduce((acc, task) => {
        const completionTime = task.completedAt - task.createdAt;
        return acc + completionTime;
      }, 0);
      // Convertir en jours et arrondir à 1 décimale
      averageCompletionTime = Math.round((totalCompletionTime / allCompletedTasks.length / (1000 * 60 * 60 * 24)) * 10) / 10;
      console.log(`⏱️ Average completion time: ${averageCompletionTime} days`);
    }

    const stats = {
      completed,
      inProgress,
      overdue,
      averageCompletionTime,
      lastUpdated: now
    };

    console.log("📊 Final statistics:", stats);

    return res.status(200).json(stats);
  } catch (error) {
    console.error('❌ Error calculating statistics:', error);
    return res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message 
    });
  }
};