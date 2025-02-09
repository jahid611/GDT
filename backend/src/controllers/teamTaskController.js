// src/controllers/teamTaskController.js
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import mongoose from "mongoose";

// Créer une tâche pour une équipe
export const createTeamTask = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id; // Supposons que votre middleware auth ajoute req.user
    const { title, description, status, priority, deadline, estimatedTime, assignedTo } = req.body;

    // Vérifier que l'équipe existe et que l'utilisateur est le leader
    const team = await Team.findOne({ _id: teamId, leader: userId });
    if (!team) {
      return res.status(403).json({ error: "Seul le leader peut créer des tâches pour cette équipe" });
    }

    const newTask = new Task({
      title,
      description,
      status,
      priority,
      deadline: deadline ? new Date(deadline) : null,
      estimatedTime,
      assignedTo: assignedTo ? mongoose.Types.ObjectId(assignedTo) : null,
      createdBy: userId,
      teamId: teamId,
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error in createTeamTask:", error);
    res.status(500).json({ error: "Impossible de créer la tâche", details: error.message });
  }
};

// Récupérer les tâches pour une équipe
export const getTeamTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    // Vérifiez que l'utilisateur est membre de l'équipe
    const team = await Team.findOne({ _id: teamId, members: req.user.id });
    if (!team) {
      return res.status(403).json({ error: "Accès non autorisé à cette équipe" });
    }

    const tasks = await Task.find({ teamId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error in getTeamTasks:", error);
    res.status(500).json({ error: "Impossible de charger les tâches", details: error.message });
  }
};
