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
import { Calendar, AlertCircle, RotateCcw, ArrowLeftRight, X } from "lucide-react"
import { format } from "date-fns"
import { enUS, fr, ro } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "@/components/ui/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

const getColumns = (t) => ({
  todo: {
    id: "todo",
    title: t("todo"),
    className: "bg-card border-l-4 border-l-gray-400",
    icon: "📋",
  },
  in_progress: {
    id: "in_progress",
    title: t("inProgress"),
    className: "bg-card border-l-4 border-l-blue-400",
    icon: "🔄",
  },
  review: {
    id: "review",
    title: t("review"),
    className: "bg-card border-l-4 border-l-yellow-400",
    icon: "👀",
  },
  done: {
    id: "done",
    title: t("done"),
    className: "bg-card border-l-4 border-l-green-400",
    icon: "✅",
  },
})

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{column.icon}</span>
          <h2 className="font-bold text-lg">{column.title}</h2>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <motion.div
        ref={setNodeRef}
        animate={{
          backgroundColor: isOver ? "rgba(var(--primary) / 0.1)" : "transparent",
        }}
        transition={{ duration: 0.2 }}
        className={`min-h-[200px] p-4 rounded-lg ${column.className} transition-all duration-200
          ${isOver ? "ring-2 ring-primary ring-offset-2 scale-[1.02]" : ""}
          ${tasks.length === 0 ? "flex items-center justify-center" : ""}`}
      >
        {tasks.length === 0 ? (
          <div
            className={`w-full h-full min-h-[200px] flex items-center justify-center 
            border-2 border-dashed rounded-lg
            ${isOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"}
            transition-colors duration-200`}
          >
            <p className="text-sm text-muted-foreground">{isOver ? t("dropHere") : t("noTasks")}</p>
          </div>
        ) : (
          <div
            className={`space-y-3 h-full min-h-[200px] 
            ${isOver ? "bg-primary/5 rounded-lg border-2 border-dashed border-primary" : ""}`}
          >
            <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence>
                {tasks.map((task) => (
                  <DraggableTask key={task._id} task={task} isDragging={task._id === activeId} />
                ))}
              </AnimatePresence>
            </SortableContext>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function DraggableTask({ task, isDragging }) {
  const { t, language } = useTranslation()
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

  return (
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
        className={`mb-2 group cursor-grab active:cursor-grabbing ${
          isDragging ? "shadow-lg scale-105 rotate-3" : "hover:shadow-md transition-all duration-200"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium flex-1">{task.title}</h3>
                <Badge className={PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}>
                  {t(task.priority || "medium")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
              {task.assignedTo?.name && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    {task.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-muted-foreground">{task.assignedTo.name}</span>
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {task.deadline && (
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-primary" />
                    {format(new Date(task.deadline), "Pp", { locale: getLocale() })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function TaskKanban() {
  const { t, language } = useTranslation()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeId, setActiveId] = useState(null)
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
    document.body.style.cursor = "grabbing"
    setShowHint(false)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">{t("loadingTasks")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Button onClick={loadTasks} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t("tryAgain")}
        </Button>
      </div>
    )
  }

  const getTasksByStatus = (status) => tasks.filter((task) => task.status === status)

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-lg p-4 shadow-lg flex items-center gap-3 text-sm max-w-sm"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
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
                <ArrowLeftRight className="h-4 w-4 text-primary" />
              </motion.div>
            </div>
            <div>
              <p className="font-medium text-foreground">{t("dragToChangeStatus")}</p>
              <p className="text-muted-foreground text-xs mt-1">{t("dragToChangeStatusHint")}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => setShowHint(false)}
            >
              <X className="h-4 w-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
          {Object.entries(COLUMNS).map(([id, column]) => (
            <DroppableColumn key={id} id={id} column={column} tasks={getTasksByStatus(id)} activeId={activeId} />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

