import React from "react"
import TaskCreationForm from "./TaskCreationForm"

export default function TaskCreationDialog({ open, onOpenChange, onSuccess, onTaskCreated }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Créer une nouvelle tâche</h2>
          <TaskCreationForm onSuccess={onSuccess} onCancel={() => onOpenChange(false)} onTaskCreated={onTaskCreated} />
        </div>
      </div>
    </div>
  )
}

