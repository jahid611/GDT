// src/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["todo", "in_progress", "review", "done"],
    default: "todo",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null }, // Pour associer la tâche à une équipe
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deadline: { type: Date, default: null },
  estimatedTime: { type: Number, default: 0 },
  attachments: [{ type: String }], // URLs ou données en base64
  imageUrl: { type: String, default: "" },
});

// Ajout d'index pour améliorer les performances lors des requêtes
taskSchema.index({ createdAt: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ teamId: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;
