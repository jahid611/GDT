import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import TaskCreationForm from './TaskCreationForm'

export default function TaskEditDialog({ task, open, onOpenChange, onTaskUpdated }) {
  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier la tâche</DialogTitle>
        </DialogHeader>
        <TaskCreationForm 
          initialData={task}
          onSuccess={onTaskUpdated}
          mode="edit"
        />
      </DialogContent>
    </Dialog>
  )
}