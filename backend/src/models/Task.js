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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  deadline: {
    type: Date,
    default: null,
  },
  estimatedTime: {
    type: Number, // en heures
    default: null,
  },
  actualTime: {
    type: Number, // en heures
    default: null,
  }
});

// Middleware pre-save pour mettre à jour updatedAt
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Si le statut passe à "done", on enregistre la date de complétion
  if (this.isModified('status') && this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Middleware pre-update pour mettre à jour updatedAt
taskSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  
  // Si le statut passe à "done", on enregistre la date de complétion
  if (this._update.status === 'done') {
    this.set({ completedAt: new Date() });
  }
  
  next();
});

// Méthode virtuelle pour calculer le temps restant avant la deadline
taskSchema.virtual('timeRemaining').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  return this.deadline - now;
});

// Méthode virtuelle pour vérifier si la tâche est en retard
taskSchema.virtual('isOverdue').get(function() {
  if (!this.deadline || this.status === 'done') return false;
  return new Date() > this.deadline;
});

// Méthode virtuelle pour calculer la durée totale de la tâche
taskSchema.virtual('duration').get(function() {
  if (!this.completedAt) return null;
  return this.completedAt - this.createdAt;
});

// Configuration des virtuals
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Index pour améliorer les performances des requêtes statistiques
taskSchema.index({ status: 1, completedAt: 1 });
taskSchema.index({ status: 1, deadline: 1 });
taskSchema.index({ createdAt: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;