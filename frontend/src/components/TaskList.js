import { useState, useEffect } from "react"
import { fetchTasks, updateTask, deleteTask } from "../utils/api"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  RefreshCw,
  SortAsc,
  Trash2,
  MoreVertical,
  AlertCircle,
  Edit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { enUS, fr } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/useToast"
import TaskEditDialog from "./TaskEditDialog"

function TaskList({ newTask }) {
  const { t, language } = useTranslation()
  const { showToast } = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState("deadline")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  const loadTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedTasks = await fetchTasks()
      setTasks(fetchedTasks)
    } catch (error) {
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId))
      showToast("success", t("taskDeleted"))
    } catch (error) {
      console.error("Error deleting task:", error)
      showToast("error", t("taskDeleteError"))
    }
  }

  const handleStatusUpdate = async (taskId, currentStatus) => {
    const newStatus = getNextStatus(currentStatus)
    try {
      await updateTask(taskId, { status: newStatus })
      setTasks((prevTasks) => prevTasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task)))
      showToast("success", t("statusUpdated"))
    } catch (error) {
      console.error("Error updating task status:", error)
      showToast("error", t("statusUpdateError"))
    }
  }

  const getNextStatus = (status) => {
    switch (status) {
      case "todo":
        return "in_progress"
      case "in_progress":
        return "review"
      case "review":
        return "done"
      default:
        return "todo"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "bg-red-200/80 text-red-900 dark:bg-red-300/20 dark:text-red-300"
      case "in_progress":
        return "bg-blue-200/80 text-blue-900 dark:bg-blue-300/20 dark:text-blue-300"
      case "review":
        return "bg-yellow-200/80 text-yellow-900 dark:bg-yellow-300/20 dark:text-yellow-300"
      case "done":
        return "bg-green-200/80 text-green-900 dark:bg-green-300/20 dark:text-green-300"
      default:
        return ""
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "todo":
        return t("todo")
      case "in_progress":
        return t("inProgress")
      case "review":
        return t("review")
      case "done":
        return t("done")
      default:
        return ""
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white"
      case "medium":
        return "bg-yellow-500 text-white"
      case "low":
        return "bg-green-500 text-white"
      default:
        return ""
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return t("high")
      case "medium":
        return t("medium")
      case "low":
        return t("low")
      default:
        return ""
    }
  }

  const getCardBackground = (status) => {
    switch (status) {
      case "todo":
        return "bg-red-100/80 dark:bg-red-950/40"
      case "in_progress":
        return "bg-blue-100/80 dark:bg-blue-950/40"
      case "review":
        return "bg-yellow-100/80 dark:bg-yellow-950/40"
      case "done":
        return "bg-green-100/80 dark:bg-green-950/40"
      default:
        return ""
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterPriority !== "all" && task.priority !== filterPriority) return false
    return true
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline)
    } else if (sortBy === "priority") {
      return getPriorityOrder(b.priority) - getPriorityOrder(a.priority)
    } else if (sortBy === "status") {
      return getStatusOrder(a.status) - getStatusOrder(b.status)
    }
    return 0
  })

  const getPriorityOrder = (priority) => {
    switch (priority) {
      case "high":
        return 3
      case "medium":
        return 2
      case "low":
        return 1
      default:
        return 0
    }
  }

  const getStatusOrder = (status) => {
    switch (status) {
      case "todo":
        return 1
      case "in_progress":
        return 2
      case "review":
        return 3
      case "done":
        return 4
      default:
        return 0
    }
  }

  const filteredAndSortedTasks = sortedTasks

  useEffect(() => {
    loadTasks()
  }, [newTask, sortBy, filterStatus, filterPriority, language]) // Added language to dependencies

  const sendAssignmentEmail = async (task) => {
    try {
      if (!task.assignedTo?.email) {
        console.log("Pas d'email fourni")
        return
      }

      console.log("Préparation de l'envoi à:", task.assignedTo.email)

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: task.assignedTo.email,
          task: {
            ...task,
            deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'email")
      }

      console.log("Email envoyé avec succès:", data)
      showToast("success", "Email envoyé avec succès")
    } catch (error) {
      console.error("Erreur détaillée:", error)
      showToast("error", "Erreur lors de l'envoi de l'email")
    }
  }

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prevTasks) => {
      const oldTask = prevTasks.find((task) => task._id === updatedTask._id)
      const wasReassigned = oldTask?.assignedTo?.email !== updatedTask.assignedTo?.email

      if (wasReassigned && updatedTask.assignedTo?.email) {
        sendAssignmentEmail(updatedTask)
      }

      return prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
    })
    setIsEditDialogOpen(false)
  }

  useEffect(() => {
    if (newTask?.assignedTo?.email) {
      sendAssignmentEmail(newTask)
    }
  }, [newTask])

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-background/60 backdrop-blur-lg border-b -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 sm:py-6"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("taskList")}</h2>
              <p className="text-sm text-muted-foreground">
                {filteredAndSortedTasks.length} {t("tasks")} {t("total")}
              </p>
            </div>
            <Button
              onClick={loadTasks}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:opacity-90"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 bg-background">
                <SortAsc className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent sideOffset={8}>
                <SelectItem value="deadline">{t("deadline")}</SelectItem>
                <SelectItem value="priority">{t("priority")}</SelectItem>
                <SelectItem value="status">{t("status")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 bg-background">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={t("filterByStatus")} />
              </SelectTrigger>
              <SelectContent sideOffset={8}>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="todo">{t("todo")}</SelectItem>
                <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                <SelectItem value="review">{t("review")}</SelectItem>
                <SelectItem value="done">{t("done")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 bg-background">
                <AlertCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={t("filterByPriority")} />
              </SelectTrigger>
              <SelectContent sideOffset={8}>
                <SelectItem value="all">{t("allPriorities")}</SelectItem>
                <SelectItem value="high">{t("high")}</SelectItem>
                <SelectItem value="medium">{t("medium")}</SelectItem>
                <SelectItem value="low">{t("low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <div className="pt-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center p-8"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">{t("loadingTasks")}</span>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-destructive/10 text-destructive p-4 rounded-lg"
            >
              {error}
              <Button variant="link" onClick={loadTasks} className="ml-2 text-destructive">
                {t("tryAgain")}
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sortedTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full p-8 text-center"
                >
                  <p className="text-muted-foreground">{t("noTasksFound")}</p>
                </motion.div>
              ) : (
                sortedTasks.map((task, index) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300",
                      "backdrop-blur-sm dark:backdrop-blur-md",
                      "border border-white/10 dark:border-white/5",
                      getCardBackground(task.status),
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative p-4 sm:p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-base sm:text-lg tracking-tight line-clamp-2 dark:text-white">
                          {task.title}
                        </h3>
                        <div className="flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("edit")}
                              </DropdownMenuItem>
                              {task.status !== "done" && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(task._id, task.status)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {t("advanceStatus")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteTask(task._id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground dark:text-white/70 line-clamp-3">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>

                      <div className="pt-4 border-t dark:border-white/10 space-y-4">
                        <div className="grid gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 dark:bg-primary/20">
                                {task.createdBy?.email?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground dark:text-white/60">{t("createdBy")}</span>
                              <span className="text-sm font-medium dark:text-white">{task.createdBy?.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-secondary/10 dark:bg-secondary/20">
                                {task.assignedTo?.email?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground dark:text-white/60">
                                {t("assignedTo")}
                              </span>
                              <span className="text-sm font-medium dark:text-white">{task.assignedTo?.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground dark:text-white/60">
                          {task.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span
                                className={cn(
                                  new Date(task.deadline) < new Date() &&
                                    "text-destructive dark:text-red-400 font-medium",
                                )}
                              >
                                {format(new Date(task.deadline), "Pp", {
                                  locale: language === "fr" ? fr : enUS,
                                })}
                              </span>
                            </div>
                          )}

                          {task.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {task.estimatedTime}h {t("estimated")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      <TaskEditDialog
        task={selectedTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={handleTaskUpdated}
        language={language}
        t={t}
        showToast={showToast}
      />
    </div>
  )
}

export default TaskList

