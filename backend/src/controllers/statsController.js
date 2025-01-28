import Task from "../models/Task.js";

export const getTaskStats = async (req, res) => {
  try {
    console.log("📊 Calculating task statistics...");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [completed, inProgress, overdue] = await Promise.all([
      // Tâches terminées ce mois
      Task.countDocuments({
        status: 'done',
        updatedAt: { $gte: startOfMonth }
      }),
      
      // Tâches en cours
      Task.countDocuments({
        status: { $in: ['in_progress', 'review'] }
      }),
      
      // Tâches en retard
      Task.countDocuments({
        status: { $ne: 'done' },
        deadline: { $lt: now }
      })
    ]);

    // Calculer le temps moyen de complétion
    const completedTasks = await Task.find({
      status: 'done',
      createdAt: { $exists: true },
      updatedAt: { $exists: true }
    });

    let averageCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalCompletionTime = completedTasks.reduce((acc, task) => {
        return acc + (task.updatedAt - task.createdAt);
      }, 0);
      averageCompletionTime = Math.round((totalCompletionTime / completedTasks.length / (1000 * 60 * 60 * 24)) * 10) / 10;
    }

    const stats = {
      completed,
      inProgress,
      overdue,
      averageCompletionTime,
      lastUpdated: now
    };

    console.log("📊 Stats calculated:", stats);
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