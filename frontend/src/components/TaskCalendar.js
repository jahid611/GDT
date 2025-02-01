"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { fetchTasks, updateTask, deleteTask } from "../utils/api"
import {
  CalendarIcon,
  Loader2,
  RefreshCw,
  Clock,
  AlertCircle,
  Edit,
  User2,
  Filter,
  SortAsc,
  SortDesc,
  Star,
  Search,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  format,
  isSameDay,
  isToday,
  isPast,
  addDays,
  subDays,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { fr, enUS, ro } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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

const locales = {
  fr,
  en: enUS,
  ro,
}

const PRIORITY_COLORS = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-100",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100",
  low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-100",
}

const STATUS_STYLES = {
  todo: {
    color: "bg-yellow-500 text-white",
    cardStyle: "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/20",
    icon: AlertTriangle,
  },
  in_progress: {
    color: "bg-blue-500 text-white",
    cardStyle: "border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/20",
    icon: Clock,
  },
  review: {
    color: "bg-purple-500 text-white",
    cardStyle: "border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-900/20",
    icon: Eye,
  },
  done: {
    color: "bg-green-500 text-white",
    cardStyle: "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/20",
    icon: CheckCircle2,
  },
  cancelled: {
    color: "bg-red-500 text-white",
    cardStyle: "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20",
    icon: XCircle,
  },
}

function TaskCalendar() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(new Date())
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [sortDirection, setSortDirection] = useState("asc")
  const [sortBy, setSortBy] = useState("deadline")
  const [view, setView] = useState("day")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [showOverdue, setShowOverdue] = useState(true)
  const [favorites, setFavorites] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const { t, language } = useTranslation()

  const dateLocale = locales[language] || enUS

  // Détection du mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const loadTasks = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true)
        else setLoading(true)
        setError(null)
        const tasksData = await fetchTasks()
        setTasks(tasksData)
      } catch (err) {
        console.error("Error loading tasks:", err)
        setError(err.message || t("cannotLoadTasks"))
        toast({
          title: t("error"),
          description: t("cannotLoadTasks"),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [t],
  )

  useEffect(() => {
    loadTasks()
    const savedFavorites = localStorage.getItem("taskFavorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [loadTasks])

  useEffect(() => {
    localStorage.setItem("taskFavorites", JSON.stringify(favorites))
  }, [favorites])

  const handleNextDay = () => setDate(addDays(date, 1))
  const handlePrevDay = () => setDate(subDays(date, 1))

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      setTasks(tasks.filter((task) => task._id !== taskId))
      toast({
        title: t("success"),
        description: t("taskDeleted"),
      })
      setFavorites(favorites.filter((id) => id !== taskId))
    } catch (err) {
      toast({
        title: t("error"),
        description: t("errorDeletingTask"),
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const taskToUpdate = tasks.find((t) => t._id === taskId)
      if (!taskToUpdate) return

      const updatedTask = await updateTask(taskId, {
        ...taskToUpdate,
        status: newStatus,
        lastStatusChange: new Date().toISOString(),
      })

      setTasks(tasks.map((task) => (task._id === taskId ? updatedTask : task)))

      toast({
        title: t("success"),
        description: t("statusUpdated"),
      })
    } catch (err) {
      toast({
        title: t("error"),
        description: t("errorUpdatingStatus"),
        variant: "destructive",
      })
    }
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const toggleFavorite = (taskId) => {
    setFavorites((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId)
      }
      return [...prev, taskId]
    })
  }

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      if (!task.deadline) return false

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
        if (!matchesSearch) return false
      }

      if (filterStatus !== "all" && task.status !== filterStatus) {
        return false
      }

      if (filterPriority !== "all" && task.priority !== filterPriority) {
        return false
      }

      if (selectedTags.length > 0) {
        if (!task.tags || !selectedTags.every((tag) => task.tags.includes(tag))) {
          return false
        }
      }

      if (view === "day") {
        return isSameDay(new Date(task.deadline), date)
      } else {
        const weekStart = startOfWeek(date)
        const weekEnd = endOfWeek(date)
        return isWithinInterval(new Date(task.deadline), { start: weekStart, end: weekEnd })
      }
    })

    if (!showOverdue) {
      filtered = filtered.filter((task) => !isPast(new Date(task.deadline)) || task.status === "done")
    }

    return filtered.sort((a, b) => {
      if (favorites.includes(a._id) && !favorites.includes(b._id)) return -1
      if (!favorites.includes(a._id) && favorites.includes(b._id)) return 1

      let comparison = 0
      switch (sortBy) {
        case "deadline":
          comparison = new Date(a.deadline) - new Date(b.deadline)
          break
        case "priority":
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          comparison = (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
          break
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [
    tasks,
    date,
    filterStatus,
    filterPriority,
    sortDirection,
    sortBy,
    view,
    searchQuery,
    selectedTags,
    showOverdue,
    favorites,
  ])

  const taskGroups = useMemo(() => {
    if (view === "day") return { [format(date, "yyyy-MM-dd")]: filteredAndSortedTasks }

    const groups = {}
    filteredAndSortedTasks.forEach((task) => {
      const dayKey = format(new Date(task.deadline), "yyyy-MM-dd")
      if (!groups[dayKey]) groups[dayKey] = []
      groups[dayKey].push(task)
    })
    return groups
  }, [filteredAndSortedTasks, view, date])

  const renderTaskCard = (task) => {
    const StatusIcon = STATUS_STYLES[task.status]?.icon || AlertCircle
    const isOverdue = isPast(new Date(task.deadline)) && task.status !== "done"
    const isFavorite = favorites.includes(task._id)

    return (
      <motion.div
        key={task._id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={cn(
          "group p-4 rounded-lg border transition-all hover:shadow-lg relative",
          STATUS_STYLES[task.status]?.cardStyle || "bg-card",
          isOverdue && "border-red-500 dark:border-red-500/50",
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(task._id)
          }}
          className={cn(
            "absolute top-2 right-2 p-1 rounded-full transition-colors",
            isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-gray-400 hover:text-gray-500",
          )}
        >
          <Star className={cn("w-5 h-5", isFavorite && "fill-current")} />
        </button>

        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusIcon className={cn("w-5 h-5", isOverdue ? "text-red-500" : "text-muted-foreground")} />
              <h4 className="font-medium truncate text-base sm:text-lg">{task.title}</h4>
              <Badge variant="secondary" className={STATUS_STYLES[task.status]?.color}>
                {t(task.status)}
              </Badge>
              {task.priority && (
                <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                  {t(task.priority)}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(task.deadline), isMobile ? "PP" : "PPp", { locale: dateLocale })}
              </div>
              {task.assignedTo && (
                <div className="flex items-center gap-1">
                  <User2 className="h-4 w-4" />
                  {task.assignedTo.name}
                </div>
              )}
              {task.lastStatusChange && (
                <div className="flex items-center gap-1">
                  <CalendarPlus className="h-4 w-4" />
                  {t("lastUpdated")}: {format(new Date(task.lastStatusChange), "PP", { locale: dateLocale })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                  <Edit className="h-4 w-4 mr-2" />
                  {isMobile && t("edit")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditTask(task)}>{t("edit")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleFavorite(task._id)}>
                  {isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task._id)}>
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {isMobile && t("status")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

        {task.status === "in_progress" && task.progress && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}
      </motion.div>
    )
  }

  if (loading) {
    return (
      <Card className="p-4 sm:p-8">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("loadingTasks")}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-col space-y-4 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <CardTitle>{t("taskCalendar")}</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("day")}
                className={cn("flex-1 sm:flex-none", view === "day" && "bg-primary text-primary-foreground")}
              >
                {t("dayView")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("week")}
                className={cn("flex-1 sm:flex-none", view === "week" && "bg-primary text-primary-foreground")}
              >
                {t("weekView")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchTasks")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-[200px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-1 sm:flex-none">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setFilterStatus("all")}>{t("allStatuses")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {Object.keys(STATUS_STYLES).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={filterStatus === status ? "bg-muted" : ""}
                    >
                      {t(status)}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowOverdue(!showOverdue)}>
                    <div className="flex items-center">
                      <div className="mr-2">{showOverdue ? "✓" : ""}</div>
                      {t("showOverdue")}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-1 sm:flex-none">
                    {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("deadline")}>{t("sortByDeadline")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("priority")}>{t("sortByPriority")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("title")}>{t("sortByTitle")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}>
                    {sortDirection === "asc" ? t("sortAscending") : t("sortDescending")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevDay} className="flex-1 sm:flex-none">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:w-[200px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, isMobile ? "PP" : "PPP", { locale: dateLocale })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
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
              <Button variant="outline" size="icon" onClick={handleNextDay} className="flex-1 sm:flex-none">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => loadTasks(true)}
              disabled={refreshing}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {Object.entries(STATUS_STYLES).map(([status, style]) => {
            const count = tasks.filter((t) => t.status === status).length
            const Icon = style.icon
            return (
              <Card key={status} className={cn("p-2 sm:p-4", style.cardStyle)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium text-xs sm:text-sm">{t(status)}</span>
                  </div>
                  <span className="text-lg sm:text-2xl font-bold">{count}</span>
                </div>
              </Card>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <ScrollArea className="h-[400px] sm:h-[600px] pr-4">
          <AnimatePresence mode="wait">
            {Object.entries(taskGroups).map(([dayKey, dayTasks]) => (
              <div key={dayKey} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-base sm:text-lg">
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
                    <CalendarIcon className="h-8 sm:h-12 w-8 sm:w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">{t("noTasksForDate")}</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">{dayTasks.map((task) => renderTaskCard(task))}</div>
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
          setTasks(tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
          setIsEditDialogOpen(false)
          setSelectedTask(null)
          toast({
            title: t("success"),
            description: t("taskUpdated"),
          })
        }}
      />
    </Card>
  )
}

export default TaskCalendar

