"use client"

import { useState, useEffect } from "react"
import { fetchTasks, updateTask, deleteTask } from "../utils/api"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  Calendar,
  Filter,
  RefreshCw,
  SortAsc,
  Trash2,
  MoreVertical,
  AlertCircle,
  Edit,
  ImageIcon,
  FileText,
  CheckCircle2,
  Loader2,
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
import { enUS, fr, ro } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/useToast"
import TaskEditDialog from "./TaskEditDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

const DEFAULT_AVATARS = {
  user1: "https://api.dicebear.com/7.x/initials/svg?seed=JD&backgroundColor=52,53,65,255",
  user2: "https://api.dicebear.com/7.x/initials/svg?seed=AB&backgroundColor=52,53,65,255",
  user3: "https://api.dicebear.com/7.x/initials/svg?seed=CD&backgroundColor=52,53,65,255",
  user4: "https://api.dicebear.com/7.x/initials/svg?seed=EF&backgroundColor=52,53,65,255",
}

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=??&backgroundColor=52,53,65,255"

const getAvatarForUser = (email) => {
  if (!email) return DEFAULT_AVATAR
  const hash = email.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const avatarSet = Object.values(DEFAULT_AVATARS)
  const index = Math.abs(hash) % avatarSet.length
  return avatarSet[index]
}

export default function TaskList({ newTask, user }) {
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
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)

  const getLocale = () => {
    switch (language) {
      case "fr":
        return fr
      case "ro":
        return ro
      default:
        return enUS
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedTasks = await fetchTasks()
      console.log("Tasks fetched:", fetchedTasks)
      setTasks(fetchedTasks)
    } catch (error) {
      setError(error)
      showToast("error", t("errorLoadingTasks"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [newTask, sortBy, filterStatus, filterPriority, language])

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

  const handleDeleteAllTasks = async () => {
    try {
      setLoading(true)
      await Promise.all(tasks.map((task) => deleteTask(task._id)))
      setTasks([])
      showToast("success", t("allTasksDeleted"))
    } catch (error) {
      console.error("Error deleting all tasks:", error)
      showToast("error", t("errorDeletingAllTasks"))
    } finally {
      setLoading(false)
      setIsDeleteAllDialogOpen(false)
    }
  }

  const handleStatusUpdate = async (taskId, currentStatus) => {
    const newStatus = getNextStatus(currentStatus)
    try {
      await updateTask(taskId, { status: newStatus })
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task))
      )
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

  const getStatusColor = (status) => "bg-muted/50 text-muted-foreground"

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

  const getPriorityColor = (priority) => "bg-muted/50 text-muted-foreground"

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

  // Pour la liste principale, on exclut systématiquement :
  // - les tâches dont le titre contient "|" 
  // - les tâches terminées
  const filteredTasks = tasks.filter((task) => {
    if (task.title && task.title.includes("|")) return false
    if (task.status === "done") return false
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

  // Les tâches terminées n'apparaissent que dans la boîte dédiée,
  // et on exclut les tâches dont le titre contient "|"
  const completedTasks = tasks.filter((task) => {
    if (task.title && task.title.includes("|")) return false
    return task.status === "done"
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

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
    )
    setIsEditDialogOpen(false)
  }

  const handleViewImage = (task) => {
    if (task.imageUrl) {
      fetch(task.imageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob)
          window.open(blobUrl, "_blank")
        })
        .catch((err) => console.error("Error opening image:", err))
    }
  }

  const handleViewPDF = (task) => {
    if (task.attachments && Array.isArray(task.attachments)) {
      const pdfAttachment = task.attachments.find(
        (att) => att.dataUrl && att.dataUrl.startsWith("data:application/pdf")
      )
      if (pdfAttachment) {
        window.open(pdfAttachment.dataUrl, "_blank")
      } else {
        showToast("error", t("noPDFFound"))
      }
    } else {
      showToast("error", t("noPDFFound"))
    }
  }

  console.log("Current user:", user)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-background/60 backdrop-blur-lg border-b -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4"
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight">{t("taskList")}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {sortedTasks.length} {t("tasks")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadTasks}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none bg-[#B7B949] hover:bg-[#B7B949]/90 text-white border-0 transition-colors duration-300"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1.5 sm:mr-2 ${loading ? "animate-spin" : ""}`}
                />
                <span className="text-xs sm:text-sm">{t("refresh")}</span>
              </Button>
              <Button
                onClick={() => setShowCompletedTasks((prev) => !prev)}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none bg-[#B7B949] hover:bg-[#B7B949]/90 text-white border-0 transition-colors duration-300"
              >
                <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm">
                  {showCompletedTasks ? t("hideCompletedTasks") : t("Completed Tasks")}
                </span>
              </Button>
              <Button
                onClick={() => setIsDeleteAllDialogOpen(true)}
                variant="destructive"
                size="sm"
                disabled={tasks.length === 0 || loading || user?.role !== "admin"}
                className="flex-1 sm:flex-none bg-[#B7B949] hover:bg-[#B7B949]/90 text-white border-0 transition-colors duration-300"
              >
                <Trash2 className="h-3.5 sm:h-4 w-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm">{t("Delete All")}</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm bg-background">
                <SortAsc className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 text-muted-foreground" />
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent sideOffset={8}>
                <SelectItem value="deadline">{t("deadline")}</SelectItem>
                <SelectItem value="priority">{t("priority")}</SelectItem>
                <SelectItem value="status">{t("status")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm bg-background">
                <Filter className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 text-muted-foreground" />
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
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm bg-background">
                <AlertCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 text-muted-foreground" />
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
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      getCardBackground(task.status)
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-3 sm:p-4 space-y-3 sm:space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-sm sm:text-base tracking-tight line-clamp-2 dark:text-white">
                          {task.title}
                        </h3>
                        {/* Menu à 3 points */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                              <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 sm:w-48">
                            <DropdownMenuItem onClick={() => handleEditTask(task)} className="text-xs sm:text-sm">
                              <Edit className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              {t("edit")}
                            </DropdownMenuItem>
                            {task.status !== "done" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(task._id, task.status)} className="text-xs sm:text-sm">
                                <CheckCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {t("advanceStatus")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteTask(task._id)} className="text-destructive text-xs sm:text-sm">
                              <Trash2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-3.5" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-white/70 line-clamp-2 sm:line-clamp-3">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                      <div className="grid gap-2 mt-3">
                        {task.deadline && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{t("deadline")}:</span>
                            <span className={cn("font-medium", new Date(task.deadline) < new Date() && "text-destructive dark:text-red-400")}>
                              {format(new Date(task.deadline), "Pp", { locale: getLocale() })}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Section Assigned To et Created By */}
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={task.assignedTo?.avatar || getAvatarForUser(task.assignedTo?.email)}
                              alt={task.assignedTo?.email || t("unassigned")}
                            />
                            <AvatarFallback>
                              {task.assignedTo?.email ? task.assignedTo?.email.charAt(0).toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {t("assigné à")}: {task.assignedTo?.email || t("unassigned")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={task.createdBy?.avatar || getAvatarForUser(task.createdBy?.email)}
                              alt={task.createdBy?.email || t("unknown")}
                            />
                            <AvatarFallback>
                              {task.createdBy?.email ? task.createdBy?.email.charAt(0).toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {t("créé par")}: {task.createdBy?.email || t("unknown")}
                          </span>
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

      <Sheet open={showCompletedTasks} onOpenChange={setShowCompletedTasks}>
        <SheetContent side="right" className="w-full sm:w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {t("completedTasks")} ({completedTasks.length})
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)] mt-4">
            <div className="grid gap-4">
              {completedTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full p-8 text-center"
                >
                  <p className="text-muted-foreground">{t("noCompletedTasks")}</p>
                </motion.div>
              ) : (
                completedTasks.map((task, index) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300",
                      "backdrop-blur-sm dark:backdrop-blur-md",
                      "border border-white/10 dark:border-white/5",
                      getCardBackground(task.status)
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-3 sm:p-4 space-y-3 sm:space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-sm sm:text-base tracking-tight line-clamp-2 dark:text-white">
                          {task.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-white/70 line-clamp-2 sm:line-clamp-3">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                      <div className="grid gap-2 mt-3">
                        {task.deadline && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{t("deadline")}:</span>
                            <span className={cn("font-medium", new Date(task.deadline) < new Date() && "text-destructive dark:text-red-400")}>
                              {format(new Date(task.deadline), "Pp", { locale: getLocale() })}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Section Assigned To et Created By */}
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={task.assignedTo?.avatar || getAvatarForUser(task.assignedTo?.email)}
                              alt={task.assignedTo?.email || t("unassigned")}
                            />
                            <AvatarFallback>
                              {task.assignedTo?.email ? task.assignedTo?.email.charAt(0).toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {t("assigné à")}: {task.assignedTo?.email || t("unassigned")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={task.createdBy?.avatar || getAvatarForUser(task.createdBy?.email)}
                              alt={task.createdBy?.email || t("unknown")}
                            />
                            <AvatarFallback>
                              {task.createdBy?.email ? task.createdBy?.email.charAt(0).toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {t("créé par")}: {task.createdBy?.email || t("unknown")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <TaskEditDialog
        task={selectedTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={handleTaskUpdated}
      />

      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAllTasks")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAllTasksConfirmation")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllTasks}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
