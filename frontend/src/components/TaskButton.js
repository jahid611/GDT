'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import TaskCreationForm from './TaskCreationForm'

export default function TaskButton({ onTaskCreated }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTaskCreated = (newTask) => {
    setIsOpen(false)
    onTaskCreated?.(newTask) // Propagez la nouvelle tâche au parent
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-emerald-500 hover:bg-emerald-600 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle tâche
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle tâche</DialogTitle>
          </DialogHeader>
          <TaskCreationForm onTaskCreated={handleTaskCreated} />
        </DialogContent>
      </Dialog>
    </>
  )
}