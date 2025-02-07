"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchTasks, updateTask } from "../utils/api"
import { useUrlParams } from "../hooks/useUrlParams"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle, RotateCcw, ArrowLeftRight, X, Clock, ImageIcon } from "lucide-react"
import { format } from "date-fns"
import { enUS, fr, ro } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "@/components/ui/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// Constantes pour les avatars par défaut
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

const getColumns = (t) => ({
  todo: {
    id: "todo",
    title: t("todo"),
    className: "border-t-2 border-t-[#666666]",
    color: "#666666",
  },
  in_progress: {
    id: "in_progress",
    title: t("inProgress"),
    className: "border-t-2 border-t-[#2F7FE6]",
    color: "#2F7FE6",
  },
  review: {
    id: "review",
    title: t("review"),
    className: "border-t-2 border-t-[#FDB40A]",
    color: "#FDB40A",
  },
  done: {
    id: "done",
    title: t("done"),
    className: "border-t-2 border-t-[#0AB924]",
    color: "#0AB924",
  },
})

const PRIORITY_COLORS = {
  low: {
    light: "bg-green-100 text-green-800",
    dark: "dark:bg-green-900 dark:text-green-100",
  },
  medium: {
    light: "bg-yellow-100 text-yellow-800",
    dark: "dark:bg-yellow-900 dark:text-yellow-100",
  },
  high: {
    light: "bg-red-100 text-red-800",
    dark: "dark:bg-red-900 dark:text-red-100",
  },
}

function DroppableColumn({ id, column, tasks, activeId }) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: "column",
      accepts: ["task"],
    },
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: column.color }}>
            {column.title}
          </span>
          <Badge
            variant="secondary"
            className="bg-gray-100 dark:bg-[#2D2D2D] text-gray-600 dark:text-[#999999] text-xs"
          >
            {tasks.length}
          </Badge>
        </div>
      </div>
      <motion.div
        ref={setNodeRef}
        animate={{
          backgroundColor: isOver ? "rgba(255, 255, 255, 0.05)" : "transparent",
        }}
        transition={{ duration: 0.2 }}
        className={`relative min-h-[200px] rounded-lg transition-all duration-200
          ${column.className}
          ${isOver ? "ring-2 ring-primary/50" : ""}
          bg-white dark:bg-[#1A1A1A]`}
      >
        {/* Overlay de drop */}
        <AnimatePresence>
          {isOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none z-10"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm font-medium text-primary dark:text-primary/80">{t("dropHere")}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-full p-2 space-y-2">
          {tasks.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-gray-500 dark:text-white/40">{t("noTasks")}</p>
            </div>
          ) : (
            <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence>
                {tasks.map((task) => (
                  <DraggableTask key={task._id} task={task} isDragging={task._id === activeId} />
                ))}
              </AnimatePresence>
            </SortableContext>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function DraggableTask({ task, isDragging }) {
  const { t, language } = useTranslation()
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task._id,
    data: {
      type: "task",
      task: task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Fonction pour récupérer l'URL de l'image
  const getImageUrl = useCallback(async () => {
    if (!task.imageUrl) return

    try {
      // Si c'est déjà une URL valide
      if (task.imageUrl.startsWith("http") || task.imageUrl.startsWith("blob:")) {
        setImageUrl(task.imageUrl)
        return
      }

      // Si c'est en base64
      if (task.imageUrl.startsWith("data:")) {
        setImageUrl(task.imageUrl)
        return
      }

      // Sinon, on essaie de récupérer l'image via fetch
      const response = await fetch(task.imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
    } catch (err) {
      console.error("Error loading image:", err)
    }
  }, [task.imageUrl])

  useEffect(() => {
    getImageUrl()
    return () => {
      // Cleanup des URLs créées
      if (imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [getImageUrl, imageUrl])

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

  const handleViewImage = useCallback(async () => {
    if (!task.imageUrl) return
    try {
      const response = await fetch(task.imageUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      setImageUrl(blobUrl)
      setImagePreviewOpen(true)
    } catch (err) {
      console.error("Error opening image:", err)
    }
  }, [task.imageUrl])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="touch-none"
      >
        <Card
          id={`task-${task._id}`}
          className={`group cursor-grab active:cursor-grabbing bg-white dark:bg-[#242424] border-gray-200 dark:border-[#333333] hover:shadow-md dark:hover:bg-[#2A2A2A] transition-all duration-200 ${
            isDragging ? "shadow-lg scale-105 rotate-3" : ""
          }`}
        >
          <CardContent className="p-3 space-y-3">
            {/* Titre et Description */}
            <div>
              <h3 className="text-sm text-gray-900 dark:text-white/90 font-medium">{task.title}</h3>
              {task.description && <p className="text-xs text-gray-600 dark:text-white/60 mt-1">{task.description}</p>}
            </div>

            {/* Image Preview */}
            {task.imageUrl && (
              <div className="relative group/image rounded-lg overflow-hidden">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={task.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewImage}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {t("viewImage")}
                  </Button>
                </div>
              </div>
            )}

            {/* Status et Priorité */}
            <div className="flex items-center justify-between text-xs">
              <Badge
                variant="outline"
                className="text-[10px] border-gray-200 dark:border-[#333333] text-gray-600 dark:text-gray-400"
              >
                {t(task.status)}
              </Badge>
              <Badge
                className={`${PRIORITY_COLORS[task.priority]?.light} ${PRIORITY_COLORS[task.priority]?.dark} text-[10px] px-1.5`}
              >
                {t(task.priority)}
              </Badge>
            </div>

            <Separator className="bg-gray-100 dark:bg-[#333333]" />

            {/* Informations utilisateur et dates */}
            <div className="space-y-2 text-xs">
              {/* Créé par */}
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 border border-gray-200 dark:border-white/10">
                  <AvatarImage
                    src={task.createdBy?.avatar || getAvatarForUser(task.createdBy?.email)}
                    alt={`${t("avatarOf")} ${task.createdBy?.email || t("user")}`}
                  />
                  <AvatarFallback className="text-[10px] bg-gray-100 dark:bg-[#2D2D2D] text-gray-600 dark:text-white/60">
                    {task.createdBy?.email?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">{t("createdBy")}</span>
                  <span className="text-gray-700 dark:text-gray-200">{task.createdBy?.email}</span>
                </div>
                <div className="ml-auto flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(task.createdAt), "dd/MM/yyyy", { locale: getLocale() })}</span>
                </div>
              </div>

              {/* Assigné à */}
              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5 border border-gray-200 dark:border-white/10">
                    <AvatarImage
                      src={task.assignedTo?.avatar || getAvatarForUser(task.assignedTo?.email)}
                      alt={`${t("avatarOf")} ${task.assignedTo?.email || t("user")}`}
                    />
                    <AvatarFallback className="text-[10px] bg-gray-100 dark:bg-[#2D2D2D] text-gray-600 dark:text-white/60">
                      {task.assignedTo?.email?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400">{t("assignedTo")}</span>
                    <span className="text-gray-700 dark:text-gray-200">{task.assignedTo?.email}</span>
                  </div>
                  {task.deadline && (
                    <div className="ml-auto flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(task.deadline), "dd/MM/yyyy", { locale: getLocale() })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] overflow-auto p-0">
          <div className="relative w-full h-full">
            <img src={imageUrl || "/placeholder.svg"} alt={task.title} className="w-full h-auto object-contain" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white"
              onClick={() => setImagePreviewOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function TaskKanban() {
  const { t, language } = useTranslation()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [activeDraggedTask, setActiveDraggedTask] = useState(null)
  const [showHint, setShowHint] = useState(true)
  const urlParams = useUrlParams()
  const focusedTaskId = urlParams.get("taskId")
  const COLUMNS = getColumns(t)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const tasksData = await fetchTasks()
      setTasks(tasksData)
    } catch (err) {
      console.error(t("errorLoadingTasksLog"), err)
      setError(err.message || t("errorLoadingTasks"))
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("cannotLoadTasks"),
      })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false)
    }, 8000)
    return () => clearTimeout(timer)
  }, [])

  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    const draggedTask = tasks.find((task) => task._id === active.id)
    setActiveDraggedTask(draggedTask)
    document.body.style.cursor = "grabbing"
    setShowHint(false)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)
    setActiveDraggedTask(null)
    document.body.style.cursor = ""

    if (!over || !active) return

    const activeTask = tasks.find((task) => task._id === active.id)
    if (!activeTask) return

    const newStatus = over.id

    if (!COLUMNS[newStatus] || activeTask.status === newStatus) return

    try {
      setTasks(tasks.map((task) => (task._id === activeTask._id ? { ...task, status: newStatus } : task)))

      await updateTask(activeTask._id, { status: newStatus })

      toast({
        title: t("success"),
        description: t("taskStatusUpdated"),
      })
    } catch (err) {
      setTasks(tasks.map((task) => (task._id === activeTask._id ? { ...task, status: activeTask.status } : task)))

      toast({
        variant: "destructive",
        title: t("error"),
        description: t("cannotUpdateTaskStatus"),
      })
    }
  }

  useEffect(() => {
    if (focusedTaskId) {
      const taskElement = document.getElementById(`task-${focusedTaskId}`)
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: "smooth", block: "center" })
        taskElement.classList.add("highlight-task")
        setTimeout(() => {
          taskElement.classList.remove("highlight-task")
        }, 2000)
      }
    }
  }, [focusedTaskId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 mb-4"></div>
        <p className="text-white/40">{t("loadingTasks")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-[#E74C3C] mb-4" />
        <p className="text-[#E74C3C] font-medium mb-4">{error}</p>
        <Button
          onClick={loadTasks}
          variant="outline"
          size="sm"
          className="border-white/20 text-white/60 hover:bg-white/5"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t("tryAgain")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white min-h-screen p-6">
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 z-50 bg-[#242424]/90 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-lg flex items-center gap-3 text-sm max-w-sm"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
              <motion.div
                animate={{
                  x: [0, 10, 0],
                  rotate: [0, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                <ArrowLeftRight className="h-4 w-4 text-white/60" />
              </motion.div>
            </div>
            <div>
              <p className="font-medium text-white/90">{t("dragToChangeStatus")}</p>
              <p className="text-white/40 text-xs mt-1">{t("dragToChangeStatusHint")}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 hover:bg-white/5"
              onClick={() => setShowHint(false)}
            >
              <X className="h-4 w-4 text-white/40" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(COLUMNS).map(([id, column]) => (
            <DroppableColumn
              key={id}
              id={id}
              column={column}
              tasks={tasks.filter((task) => task.status === id)}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDraggedTask ? (
            <div className="opacity-80 pointer-events-none">
              <DraggableTask task={activeDraggedTask} isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

