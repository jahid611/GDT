import React, { useState, useEffect } from "react"
import { fetchTasks, updateTask, deleteTask } from "../utils/api"
import { Loader2, Calendar, Clock, MoreVertical, MessageSquare, Edit, Trash2, CheckCircle, User2, RefreshCw, Filter, SortAsc } from 'lucide-react'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useNotifications } from "../contexts/NotificationContext"
import TaskEditDialog from './TaskEditDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export default function TaskList({ newTask }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState("deadline") // deadline, priority, status
  const [filterStatus, setFilterStatus] = useState("all") // all, todo, in_progress, review, done
  const [filterPriority, setFilterPriority] = useState("all") // all, low, medium, high
  const { showToast } = useNotifications()

  useEffect(() => {
    loadTasks()
  }, [])

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
      showToast("Succès", "Liste des tâches mise à jour")
    } catch (err) {
      console.error("Erreur détaillée:", err)
      setError(err.message || "Impossible de charger les tâches")
      showToast("Erreur", "Impossible de charger les tâches", "destructive")
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

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      )
    )
    setIsEditDialogOpen(false)
    setSelectedTask(null)
    showToast("Succès", "La tâche a été modifiée avec succès")
  }

  const sortTasks = (tasksToSort) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline) - new Date(b.deadline)
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case "status":
          const statusOrder = { todo: 0, in_progress: 1, review: 2, done: 3 }
          return statusOrder[a.status] - statusOrder[b.status]
        default:
          return 0
      }
    })
  }

  const filterTasks = (tasksToFilter) => {
    return tasksToFilter.filter(task => {
      const statusMatch = filterStatus === "all" || task.status === filterStatus
      const priorityMatch = filterPriority === "all" || task.priority === filterPriority
      return statusMatch && priorityMatch
    })
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

  const getStatusLabel = (status) => {
    const labels = {
      todo: "À faire",
      in_progress: "En cours",
      review: "En révision",
      done: "Terminé"
    }
    return labels[status] || status
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    }
    return colors[priority] || colors.medium
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      low: "Basse",
      medium: "Moyenne",
      high: "Haute"
    }
    return labels[priority] || priority
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

  const filteredAndSortedTasks = sortTasks(filterTasks(tasks))

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-4 p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Liste des tâches</h2>
            <Button 
              onClick={loadTasks}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SortAsc className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Trier par..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Date limite</SelectItem>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="status">Statut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="review">En révision</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            <p>Aucune tâche trouvée</p>
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <div 
              key={task._id} 
              className={`
                bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow
                ${task.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}
                ${task.deadline && new Date(task.deadline) < new Date() ? 'border-red-200' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-lg">{task.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTask(task)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      {task.status !== "done" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(task._id, task.status)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Avancer le statut
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    <span className={
                      new Date(task.deadline) < new Date() 
                        ? 'text-red-500 font-medium' 
                        : ''
                    }>
                      {format(new Date(task.deadline), "Pp", { locale: fr })}
                    </span>
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
          ))
        )}
      </div>

      <TaskEditDialog
        task={selectedTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  )
}