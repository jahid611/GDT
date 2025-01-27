import React, { useState, useEffect } from "react"
import { fetchTasks, updateTask } from "../utils/api"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const columns = {
  todo: {
    id: "todo",
    title: "À faire",
    className: "bg-gray-100",
  },
  in_progress: {
    id: "in_progress",
    title: "En cours",
    className: "bg-blue-50",
  },
  review: {
    id: "review",
    title: "En révision",
    className: "bg-yellow-50",
  },
  done: {
    id: "done",
    title: "Terminé",
    className: "bg-green-50",
  },
}

function SortableTask({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2">
        <CardContent className="p-4">
          <h3 className="font-medium">{task.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          {task.assignedTo && <p className="text-sm text-muted-foreground mt-1">Assigné à: {task.assignedTo.name}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {task.deadline && (
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(task.deadline), "Pp", { locale: fr })}
              </span>
            )}
            {task.estimatedTime && (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {task.estimatedTime}h
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TaskKanban() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const tasksData = await fetchTasks()
        setTasks(tasksData)
      } catch (err) {
        console.error("Erreur lors du chargement des tâches:", err)
        setError(err.message || "Une erreur est survenue lors du chargement des tâches")
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task._id === active.id)
      const newIndex = tasks.findIndex((task) => task._id === over.id)

      try {
        const task = tasks[oldIndex]
        const newStatus = over.data.current.sortable.containerId

        await updateTask(task._id, { status: newStatus })

        setTasks((tasks) => {
          const newTasks = arrayMove(tasks, oldIndex, newIndex)
          return newTasks.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
        })
      } catch (err) {
        console.error("Erreur lors de la mise à jour du statut:", err)
        // Revert the change in UI
        setTasks([...tasks])
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {Object.values(columns).map((column) => (
          <div key={column.id} className="space-y-4">
            <h2 className="font-bold text-lg">{column.title}</h2>
            <div className={`min-h-[200px] p-4 rounded-lg ${column.className}`}>
              <SortableContext
                items={getTasksByStatus(column.id).map((task) => task._id)}
                strategy={verticalListSortingStrategy}
              >
                {getTasksByStatus(column.id).map((task) => (
                  <SortableTask key={task._id} task={task} />
                ))}
              </SortableContext>
            </div>
          </div>
        ))}
      </div>
    </DndContext>
  )
}

