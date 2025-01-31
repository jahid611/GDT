import React, { useState, useEffect, useMemo, useCallback } from "react"
import { fetchTasks, updateTask, deleteTask } from "../utils/api"
import { CalendarIcon, Loader2, RefreshCw, Clock, AlertCircle, Edit, User2, Filter, SortAsc, SortDesc } from 'lucide-react'
import { format, isSameDay, isToday, isPast, addDays, subDays } from "date-fns"
import { fr, enUS, ro } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslation } from "../hooks/useTranslation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import TaskEditDialog from "./TaskEditDialog"
import { cn } from "@/lib/utils"

const locales = {
  fr,
  en: enUS,
  ro,
}

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100",
  low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-100"
}

const getStatusColor = (status) => {
  switch (status) {
    case "todo":
      return "bg-yellow-500 text-white";
    case "in_progress":
      return "bg-blue-500 text-white";
    case "review":
      return "bg-purple-500 text-white";
    case "done":
      return "bg-green-500 text-white";
    default:
      return "";
  }
};

function TaskCalendar() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(new Date())
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortDirection, setSortDirection] = useState('asc')
  const [view, setView] = useState('day') // 'day' ou 'week'
  const { t, language } = useTranslation()

  const dateLocale = locales[language] || enUS

  const loadTasks = useCallback(async (showRefreshing = false) => {
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
  }, [t])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleNextDay = () => setDate(addDays(date, 1))
  const handlePrevDay = () => setDate(subDays(date, 1))

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter(task => task._id !== taskId))
      alert(t("taskDeleted"))
    } catch (err) {
      alert(t("errorDeletingTask"))
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const taskToUpdate = tasks.find(t => t._id === taskId)
      if (!taskToUpdate) return

      const updatedTask = await updateTask(taskId, {
        ...taskToUpdate,
        status: newStatus
      })
      setTasks(tasks.map(task =>
        task._id === taskId ? updatedTask : task
      ))
      alert(t("statusUpdated"))
    } catch (err) {
      alert(t("errorUpdatingStatus"))
    }
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      if (!task.deadline) return false
      if (view === 'day') {
        return isSameDay(new Date(task.deadline), date)
      } else {
        // Vue semaine : afficher les tâches des 7 prochains jours
        const taskDate = new Date(task.deadline)
        return taskDate >= date && taskDate <= addDays(date, 7)
      }
    })

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus)
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.deadline)
      const dateB = new Date(b.deadline)
      return sortDirection === 'asc'
        ? dateA - dateB
        : dateB - dateA
    })
  }, [tasks, date, filterStatus, sortDirection, view])

  const taskGroups = useMemo(() => {
    if (view === 'day') return { [format(date, 'yyyy-MM-dd')]: filteredAndSortedTasks }

    const groups = {}
    filteredAndSortedTasks.forEach(task => {
      const dayKey = format(new Date(task.deadline), 'yyyy-MM-dd')
      if (!groups[dayKey]) groups[dayKey] = []
      groups[dayKey].push(task)
    })
    return groups
  }, [filteredAndSortedTasks, view, date])

  const renderTaskCard = (task) => (
    <motion.div
      key={task._id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "group p-4 rounded-lg border transition-all hover:shadow-lg",
        task.status === "done" ? "bg-muted/50" : "bg-card",
        task.priority && PRIORITY_COLORS[task.priority]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium truncate text-lg">{task.title}</h4>
            <Badge variant="secondary" className={getStatusColor(task.status)}>
              {t(task.status)}
            </Badge>
            {task.priority && (
              <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                {t(task.priority)}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(task.deadline), "HH:mm", { locale: dateLocale })}
            </div>
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <User2 className="h-4 w-4" />
                {task.assignedTo.name}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <Edit className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditTask(task)}>
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteTask(task._id)}
              >
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100"
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["todo", "in_progress", "review", "done"].map(status => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(task._id, status)}
                  className={task.status === status ? "bg-muted" : ""}
                >
                  {t(status)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )

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

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-4">
          <CardTitle>{t("taskCalendar")}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('day')}
              className={cn(view === 'day' && "bg-primary text-primary-foreground")}
            >
              {t("dayView")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('week')}
              className={cn(view === 'week' && "bg-primary text-primary-foreground")}
            >
              {t("weekView")}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                {t("allTasks")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('todo')}>
                {t("todo")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('in_progress')}>
                {t("inProgress")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('done')}>
                {t("done")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              {"<"}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px]">
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
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              {">"}
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => loadTasks(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <AnimatePresence mode="wait">
            {Object.entries(taskGroups).map(([dayKey, dayTasks]) => (
              <div key={dayKey} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg">
                    {format(new Date(dayKey), "EEEE d MMMM", { locale: dateLocale })}
                  </h3>
                  {isToday(new Date(dayKey)) && (
                    <Badge variant="secondary" className="font-normal">
                      {t("today")}
                    </Badge>
                  )}
                </div>

                {dayTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("noTasksForDate")}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {dayTasks.map(task => renderTaskCard(task))}
                  </div>
                )}
              </div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>

      <TaskEditDialog
        task={selectedTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={(updatedTask) => {
          setTasks(tasks.map(task =>
            task._id === updatedTask._id ? updatedTask : task
          ))
          setIsEditDialogOpen(false)
          setSelectedTask(null)
          alert(t("taskUpdated"))
        }}
      />
    </Card>
  )
}

export default TaskCalendar