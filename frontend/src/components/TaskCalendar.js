import React, { useState, useEffect, useMemo } from "react"
import { fetchTasks } from "../utils/api"
import { CalendarIcon, Loader2, RefreshCw, Clock, CheckCircle, AlertCircle, Edit } from "lucide-react"
import { format, isSameDay, isToday } from "date-fns"
import { fr, enUS, ro } from "date-fns/locale" // Added all locales
import { Calendar } from "@/components/ui/calendar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslation } from "../hooks/useTranslation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import TaskEditDialog from "./TaskEditDialog"
import { cn } from "@/lib/utils"

const locales = {
  fr,
  en: enUS,
  ro,
}

export default function TaskCalendar() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(new Date())
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const { t, language } = useTranslation()

  const dateLocale = locales[language] || enUS

  const loadTasks = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)
      setError(null)
      const tasksData = await fetchTasks()
      setTasks(tasksData)
    } catch (err) {
      console.error("Error loading tasks:", err)
      setError(err.message || t("cannotLoadTasks"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const tasksForDate = (date) => {
    return tasks.filter((task) => {
      if (!task.deadline) return false
      return isSameDay(new Date(task.deadline), date)
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

  // Memoize the calendar day modifier to improve performance
  const calendarDayModifier = useMemo(() => {
    return (date) => {
      const tasksOnDay = tasksForDate(date)
      if (tasksOnDay.length === 0) return null

      const hasOverdue = tasksOnDay.some((task) => new Date(task.deadline) < new Date() && task.status !== "done")
      const allCompleted = tasksOnDay.every((task) => task.status === "done")

      if (hasOverdue) return "bg-red-50 font-bold"
      if (allCompleted) return "bg-green-50 font-bold"
      return "bg-blue-50 font-bold"
    }
  }, [tasks])

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
    setIsEditDialogOpen(false)
    setSelectedTask(null)
  }

  useEffect(() => {
    loadTasks()
  }, [language]) // Added language to the dependency array

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("loadingTasks")}</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          {error}
          <Button variant="outline" size="sm" onClick={() => loadTasks()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{t("taskCalendar")}</CardTitle>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP", { locale: dateLocale })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={dateLocale}
                modifiers={{ highlight: calendarDayModifier }}
                modifiersClassNames={{
                  today: "bg-primary/10 font-bold",
                }}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => loadTasks(true)} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {t("tasksForDate")} {format(date, "d MMMM yyyy", { locale: dateLocale })}
            </h3>
            {isToday(date) && (
              <Badge variant="secondary" className="font-normal">
                {t("today")}
              </Badge>
            )}
          </div>
          <ScrollArea className="h-[400px] pr-4">
            <AnimatePresence mode="wait">
              {tasksForDate(date).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("noTasksForDate")}</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {tasksForDate(date).map((task) => (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn(
                        "group p-3 rounded-lg border transition-all hover:shadow-md",
                        task.status === "done" ? "bg-muted/50" : "bg-card",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <Badge variant="secondary" className={getStatusColor(task.status)}>
                              {t(task.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3 w-3 inline-block mr-1" />
                            {format(new Date(task.deadline), "HH:mm", { locale: dateLocale })}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {task.assignedTo && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {t("assignedTo")}: {task.assignedTo.name}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </CardContent>

      <TaskEditDialog
        task={selectedTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </Card>
  )
}

