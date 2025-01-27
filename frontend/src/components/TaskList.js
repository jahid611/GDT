import React, { useState, useEffect } from "react"
import { fetchTasks, updateTask, deleteTask } from "../utils/api"
import { Loader2, Calendar, Clock, MoreVertical, Edit, Trash2, CheckCircle, User2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useNotifications } from "../contexts/NotificationContext"

export default function TaskList({ newTask }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { showToast } = useNotifications()

  useEffect(() => {
    loadTasks()
  }, [])

  // Add new task to the list when received
  useEffect(() => {
    if (newTask) {
      setTasks((prevTasks) => [newTask, ...prevTasks])
    }
  }, [newTask])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTasks()
      setTasks(data)
    } catch (err) {
      console.error("Erreur détaillée:", err)
      setError(err.message || "Impossible de charger les tâches")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (taskId, currentStatus) => {
    try {
      const nextStatus = {
        todo: "in_progress",
        in_progress: "review",
        review: "done",
      }
      const newStatus = nextStatus[currentStatus]
      if (!newStatus) return

      const updatedTask = await updateTask(taskId, { status: newStatus })
      setTasks(tasks.map((task) => (task._id === taskId ? updatedTask : task)))
      showToast("Statut mis à jour", `La tâche a été déplacée vers ${newStatus}`)
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err)
      showToast("Erreur", "Impossible de mettre à jour le statut", "destructive")
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter((task) => task._id !== taskId))
      showToast("Tâche supprimée", "La tâche a été supprimée avec succès")
    } catch (err) {
      console.error("Erreur lors de la suppression:", err)
      showToast("Erreur", "Impossible de supprimer la tâche", "destructive")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des tâches...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md m-4">
        {error}
        <button onClick={loadTasks} className="ml-2 underline hover:no-underline">
          Réessayer
        </button>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Aucune tâche trouvée</p>
      </div>
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      todo: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      review: "bg-yellow-100 text-yellow-800",
      done: "bg-green-100 text-green-800",
    }
    return colors[status] || colors.todo
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    }
    return colors[priority] || colors.medium
  }

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <div key={task._id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-lg">{task.title}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <div className="relative group">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border hidden group-hover:block">
                  {task.status !== "done" && (
                    <button
                      onClick={() => handleStatusUpdate(task._id, task.status)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Avancer le statut
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{task.description}</p>

          <div className="space-y-2 text-sm text-gray-500">
            {task.assignedTo && (
              <div className="flex items-center">
                <User2 className="h-4 w-4 mr-2" />
                <span>{task.assignedTo.name}</span>
              </div>
            )}

            {task.deadline && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{format(new Date(task.deadline), "Pp", { locale: fr })}</span>
              </div>
            )}

            {task.estimatedTime && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{task.estimatedTime}h estimées</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

