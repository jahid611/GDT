import React, { useState, useEffect } from "react"
import { fetchTasks, updateTask, deleteTask } from "../utils/api"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  Calendar,
  Clock,
  MoreVertical,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle,
  User2,
  RefreshCw,
  Filter,
  SortAsc,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useNotifications } from "../contexts/NotificationContext"
import TaskEditDialog from "./TaskEditDialog"
import { useTranslation } from "../hooks/useTranslation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const TaskList = ({ newTask }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState("deadline")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")

  const { showToast } = useNotifications()
  const { t, language } = useTranslation()

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
      showToast(t("success"), t("taskListUpdated"))
    } catch (err) {
      console.error("Detailed error:", err)
      setError(err.message || t("cannotLoadTasks"))
      showToast(t("error"), t("cannotLoadTasks"), "destructive")
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
      showToast(t("statusUpdated"), t("taskMovedTo", { status: t(newStatus) }))
    } catch (err) {
      console.error("Status update error:", err)
      showToast(t("error"), t("cannotUpdateStatus"), "destructive")
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter((task) => task._id !== taskId))
      showToast(t("taskDeleted"), t("taskDeletedSuccess"))
    } catch (err) {
      console.error("Delete error:", err)
      showToast(t("error"), t("cannotDeleteTask"), "destructive")
    }
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
    setIsEditDialogOpen(false)
    setSelectedTask(null)
    showToast(t("success"), t("taskUpdatedSuccess"))
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
    return tasksToFilter.filter((task) => {
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
    return t(status)
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
    return t(priority)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">{t("loadingTasks")}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md m-4">
        {error}
        <button onClick={loadTasks} className="ml-2 underline hover:no-underline">
          {t("tryAgain")}
        </button>
      </div>
    )
  }

  const filteredAndSortedTasks = sortTasks(filterTasks(tasks))

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-background/60 backdrop-blur-lg border-b"
      >
        <div className="container mx-auto p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{t("taskList")}</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedTasks.length} {t("tasks")} {t("total")}
                </p>
              </div>
              <Button
                onClick={loadTasks}
                variant="outline"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:opacity-90"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {t("refresh")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative z-20">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-10 bg-background">
                    <SortAsc className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={t("sortBy")} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="deadline">{t("deadline")}</SelectItem>
                    <SelectItem value="priority">{t("priority")}</SelectItem>
                    <SelectItem value="status">{t("status")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative z-20">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] h-10 bg-background">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={t("filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="todo">{t("todo")}</SelectItem>
                    <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                    <SelectItem value="review">{t("review")}</SelectItem>
                    <SelectItem value="done">{t("done")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative z-20">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[180px] h-10 bg-background">
                    <AlertCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={t("filterByPriority")} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">{t("allPriorities")}</SelectItem>
                    <SelectItem value="high">{t("high")}</SelectItem>
                    <SelectItem value="medium">{t("medium")}</SelectItem>
                    <SelectItem value="low">{t("low")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto p-6">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full p-8 text-center"
                >
                  <p className="text-muted-foreground">{t("noTasksFound")}</p>
                </motion.div>
              ) : (
                filteredAndSortedTasks.map((task, index) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      group relative overflow-hidden rounded-xl bg-gradient-to-br from-card to-card/50
                      border shadow-md hover:shadow-xl transition-all duration-300
                      ${task.priority === "high" ? "border-l-4 border-l-red-500" : ""}
                      ${task.deadline && new Date(task.deadline) < new Date() ? "border-red-200" : ""}
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg tracking-tight line-clamp-2">{task.title}</h3>
                        <div className="flex items-center gap-2 ml-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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

                      <p className="text-muted-foreground text-sm line-clamp-3">{task.description}</p>

                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <Badge variant="secondary" className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>

                      <div className="pt-4 border-t space-y-3">
                        {task.assignedTo && (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://avatar.vercel.sh/${task.assignedTo?.email || "default"}`} />
                              <AvatarFallback>
                                {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{task.assignedTo?.name || t("unassigned")}</span>
                              <span className="text-xs text-muted-foreground">{task.assignedTo?.email || "-"}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {task.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span
                                className={new Date(task.deadline) < new Date() ? "text-destructive font-medium" : ""}
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
      />
    </div>
  )
}
export default TaskList

