// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Le titre est requis"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "La description est requise"],
    trim: true,
  },
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
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Un créateur est requis"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
    default: null,
  },
  // Ajout du champ imageUrl
  imageUrl: {
    type: String,
    default: "",
  },
});

const Task = mongoose.model("Task", taskSchema);
export default Task;
