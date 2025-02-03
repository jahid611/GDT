"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { fetchTasks, updateTask } from "../utils/api"
import {
  CalendarIcon,
  Loader2,
  RefreshCw,
  Clock,
  AlertCircle,
  Edit,
  Filter,
  SortAsc,
  SortDesc,
  Star,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  format,
  isSameDay,
  isPast,
  addDays,
  subDays,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfDay,
} from "date-fns"
import { fr, enUS } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslation } from "../hooks/useTranslation"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import TaskEditDialog from "./TaskEditDialog"
import { cn } from "@/lib/utils"

const locales = { fr, en: enUS }

const STATUS_STYLES = {
  todo: {
    color: "bg-red-100 text-red-700 dark:bg-red-800/40 dark:text-red-100",
    cardStyle: "border-red-200 bg-red-50 dark:border-red-700/40 dark:bg-red-800/20",
    icon: AlertTriangle,
  },
  in_progress: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-700/40 dark:text-blue-100",
    cardStyle: "border-blue-200 bg-blue-50 dark:border-blue-600/40 dark:bg-blue-700/20",
    icon: Clock,
  },
  review: {
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/40 dark:text-yellow-100",
    cardStyle: "border-yellow-200 bg-yellow-50 dark:border-yellow-600/40 dark:bg-yellow-700/20",
    icon: Eye,
  },
  done: {
    color: "bg-green-100 text-green-700 dark:bg-green-700/40 dark:text-green-100",
    cardStyle: "border-green-200 bg-green-50 dark:border-green-600/40 dark:bg-green-700/20",
    icon: CheckCircle2,
  },
}

function TaskCalendar() {
  const { t, language } = useTranslation()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState("day")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("deadline")
  const [sortDirection, setSortDirection] = useState("asc")
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("taskFavorites")
    return saved ? JSON.parse(saved) : []
  })
  const [selectedTask, setSelectedTask] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const dateLocale = locales[language] || enUS

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const tasksData = await fetchTasks()
      setTasks(tasksData)
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to load tasks"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useEffect(() => {
    localStorage.setItem("taskFavorites", JSON.stringify(favorites))
  }, [favorites])

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) => task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query),
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((task) => task.status === filterStatus)
    }

    // Filter by view
    if (view === "favorites") {
      filtered = filtered.filter((task) => favorites.includes(task._id))
    } else if (view === "day") {
      filtered = filtered.filter((task) => {
        const taskDate = task.deadline ? startOfDay(new Date(task.deadline)) : null
        return taskDate && isSameDay(taskDate, date)
      })
    } else if (view === "week") {
      filtered = filtered.filter((task) => {
        const taskDate = task.deadline ? new Date(task.deadline) : null
        if (!taskDate) return false
        const weekStart = startOfWeek(date)
        const weekEnd = endOfWeek(date)
        return isWithinInterval(taskDate, { start: weekStart, end: weekEnd })
      })
    }

    // Sort tasks
    return filtered.sort((a, b) => {
      if (favorites.includes(a._id) && !favorites.includes(b._id)) return -1
      if (!favorites.includes(a._id) && favorites.includes(b._id)) return 1

      let comparison = 0
      if (sortBy === "deadline") {
        comparison = new Date(a.deadline) - new Date(b.deadline)
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title)
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [tasks, searchQuery, filterStatus, view, favorites, date, sortBy, sortDirection])

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTask = await updateTask(taskId, { status: newStatus })
      setTasks(tasks.map((task) => (task._id === taskId ? updatedTask : task)))
      toast({
        title: t("Success"),
        description: t("Status updated"),
      })
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to update status"),
        variant: "destructive",
      })
    }
  }

  const toggleFavorite = (taskId) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]

      toast({
        title: prev.includes(taskId) ? t("Removed from favorites") : t("Added to favorites"),
        description: tasks.find((t) => t._id === taskId)?.title,
      })

      return newFavorites
    })
  }

  const renderTaskCard = (task) => {
    const StatusIcon = STATUS_STYLES[task.status]?.icon || AlertCircle
    const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done"
    const isFavorite = favorites.includes(task._id)

    return (
      <motion.div
        key={task._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "group p-4 rounded-lg border transition-all hover:shadow-lg",
          STATUS_STYLES[task.status]?.cardStyle,
          isOverdue && "border-red-500",
          isFavorite && "ring-2 ring-yellow-400",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium text-base">{task.title}</h3>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className={cn(STATUS_STYLES[task.status]?.color, "font-medium")}>
                {t(task.status)}
              </Badge>
              {task.deadline && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {format(new Date(task.deadline), "PPp", { locale: dateLocale })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(task._id)}
              className={cn(
                "h-8 w-8 transition-colors",
                isFavorite
                  ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50 transition-colors">
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedTask(task)}>{t("Edit")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.keys(STATUS_STYLES).map((status) => (
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
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{format(date, "MMMM yyyy", { locale: dateLocale })}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("day")}
              className={cn("transition-colors", view === "day" && "bg-muted")}
            >
              {t("Day")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("week")}
              className={cn("transition-colors", view === "week" && "bg-muted")}
            >
              {t("Week")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("favorites")}
              className={cn("transition-colors", view === "favorites" && "bg-muted")}
            >
              <Star className={cn("h-4 w-4 mr-2", view === "favorites" && "fill-current")} />
              {t("Favorites")}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(subDays(date, 1))}
              className="hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[130px] px-2 hover:bg-muted/50 transition-colors">
                  {format(date, "PPP", { locale: dateLocale })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(addDays(date, 1))}
              className="hover:bg-muted/50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder={t("Search tasks...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[200px]"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hover:bg-muted/50 transition-colors">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>{t("All statuses")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.keys(STATUS_STYLES).map((status) => (
                  <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)}>
                    {t(status)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hover:bg-muted/50 transition-colors">
                  {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("deadline")}>{t("Sort by deadline")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title")}>{t("Sort by title")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}>
                  {sortDirection === "asc" ? t("Ascending") : t("Descending")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" onClick={loadTasks} className="hover:bg-muted/50 transition-colors">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(STATUS_STYLES).map(([status, style]) => {
          const count = tasks.filter((t) => t.status === status).length
          const Icon = style.icon
          return (
            <Card key={status} className={cn("transition-colors hover:shadow-md", style.cardStyle)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{t(status)}</span>
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {view === "favorites" ? (
                <>
                  <Star className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("No favorite tasks")}</p>
                </>
              ) : (
                <>
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("No tasks found")}</p>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence>{filteredAndSortedTasks.map(renderTaskCard)}</AnimatePresence>
          )}
        </div>
      </ScrollArea>

      <TaskEditDialog
        task={selectedTask}
        open={Boolean(selectedTask)}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onTaskUpdated={(updatedTask) => {
          setTasks(tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
          setSelectedTask(null)
          toast({
            title: t("Success"),
            description: t("Task updated"),
          })
        }}
      />
    </div>
  )
}

export default TaskCalendar

