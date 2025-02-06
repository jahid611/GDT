"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { fetchTasks, updateTask } from "../utils/api"
import {
  RefreshCw,
  Clock,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Share2,
  Printer,
  Plus,
  Search,
} from "lucide-react"
import {
  format,
  isSameDay,
  addDays,
  subDays,
  isWithinInterval,
  startOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  getHours,
  getMinutes,
  setHours,
  parseISO,
  isValid,
} from "date-fns"
import { fr, enUS, ro } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "../hooks/useTranslation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import TaskEditDialog from "./TaskEditDialog"
import { cn } from "@/lib/utils"

const locales = { fr, en: enUS, ro }

// Constants
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9) // 9 AM to 9 PM
const MINUTES_IN_HOUR = 60
const HOUR_HEIGHT = 80 // pixels per hour
const MINUTE_HEIGHT = HOUR_HEIGHT / MINUTES_IN_HOUR
const AUTO_REFRESH_INTERVAL = 30000 // 30 seconds

const VIEWS = [
  { id: "day", label: "Day" },
  { id: "work_week", label: "Work Week" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
]

const STATUS_STYLES = {
  todo: {
    color: "bg-red-500/90 hover:bg-red-500",
    border: "border-red-400",
    text: "text-red-50",
    icon: AlertTriangle,
    label: "À faire",
  },
  in_progress: {
    color: "bg-blue-500/90 hover:bg-blue-500",
    border: "border-blue-400",
    text: "text-blue-50",
    icon: Clock,
    label: "En cours",
  },
  review: {
    color: "bg-yellow-500/90 hover:bg-yellow-500",
    border: "border-yellow-400",
    text: "text-yellow-50",
    icon: Eye,
    label: "En révision",
  },
  done: {
    color: "bg-green-500/90 hover:bg-green-500",
    border: "border-green-400",
    text: "text-green-50",
    icon: CheckCircle2,
    label: "Terminé",
  },
}

export default function TaskCalendar() {
  const { t, language } = useTranslation()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState("week")
  const [selectedTask, setSelectedTask] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const dateLocale = locales[language] || enUS

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks()
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const tasksData = await fetchTasks()
      setTasks(tasksData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to load tasks:", error)
      toast({
        title: t("error"),
        description: t("failedToLoadTasks"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Calculate week days based on view
  const weekDays = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = view === "work_week" ? addDays(start, 4) : addDays(start, 6)

    if (!isValid(start) || !isValid(end)) {
      return []
    }

    try {
      return eachDayOfInterval({ start, end })
    } catch (error) {
      console.error("Error calculating week days:", error)
      return []
    }
  }, [date, view])

  // Filter and organize tasks by day
  const tasksByDay = useMemo(() => {
    if (!weekDays.length) return []

    return weekDays.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const dayTasks = tasks.filter((task) => {
        if (!task.deadline) return false
        const taskDate = parseISO(task.deadline)
        if (!isValid(taskDate)) return false

        // Apply filters
        if (filterStatus !== "all" && task.status !== filterStatus) return false
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false

        return isWithinInterval(taskDate, { start: dayStart, end: dayEnd })
      })

      return {
        date: day,
        tasks: dayTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
      }
    })
  }, [tasks, weekDays, filterStatus, searchQuery])

  // Calculate task position and height
  const getTaskPosition = (deadline) => {
    const date = parseISO(deadline)
    if (!isValid(date)) return { top: 0, height: HOUR_HEIGHT }

    const hours = getHours(date) - 9 // Offset from 9 AM
    const minutes = getMinutes(date)
    const top = hours * HOUR_HEIGHT + minutes * MINUTE_HEIGHT

    return { top, height: HOUR_HEIGHT }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const handleDateChange = (amount) => {
    switch (view) {
      case "day":
        setDate(amount > 0 ? addDays(date, 1) : subDays(date, 1))
        break
      case "work_week":
      case "week":
        setDate(amount > 0 ? addWeeks(date, 1) : subWeeks(date, 1))
        break
      case "month":
        setDate(amount > 0 ? addWeeks(date, 4) : subWeeks(date, 4))
        break
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTask = await updateTask(taskId, { status: newStatus })
      setTasks(tasks.map((task) => (task._id === taskId ? updatedTask : task)))
      toast({
        title: t("success"),
        description: t("statusUpdated"),
      })
    } catch (error) {
      console.error("Failed to update task status:", error)
      toast({
        title: t("error"),
        description: t("failedToUpdateStatus"),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-[#1B1A1A] text-white overflow-hidden rounded-lg border border-[#323131]">
      {/* Mini Calendar Sidebar */}
      <div className="w-64 border-r border-[#323131] flex flex-col">
        <div className="p-4 border-b border-[#323131]">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 mb-4"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("newTask")}
          </Button>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-[#252525] border-[#323131]"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            className="rounded-md border border-[#323131]"
            locale={dateLocale}
          />

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-400 uppercase tracking-wider">{t("filters")}</h3>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start", filterStatus === "all" && "bg-[#252525]")}
                  onClick={() => setFilterStatus("all")}
                >
                  {t("allTasks")}
                </Button>
                {Object.entries(STATUS_STYLES).map(([status, style]) => {
                  const Icon = style.icon
                  const count = tasks.filter((t) => t.status === status).length
                  return (
                    <Button
                      key={status}
                      variant="ghost"
                      className={cn("w-full justify-start gap-2", filterStatus === status && "bg-[#252525]")}
                      onClick={() => setFilterStatus(status)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{style.label}</span>
                      <Badge variant="secondary" className="ml-2">
                        {count}
                      </Badge>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Command Bar */}
        <div className="border-b border-[#323131] p-2 flex items-center justify-between bg-[#252525] sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDate(new Date())}
              className="text-[#2F7FE6] font-medium"
            >
              {t("today")}
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold">
              {format(weekDays[0] || date, "MMMM d")} - {format(weekDays[weekDays.length - 1] || date, "MMMM d, yyyy")}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {VIEWS.map((v) => (
              <Button
                key={v.id}
                variant={view === v.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView(v.id)}
                className={view === v.id ? "bg-[#323131]" : ""}
              >
                {t(v.label)}
              </Button>
            ))}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={loadTasks}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("refresh")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("share")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("print")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr] h-full">
            {/* Time Labels */}
            <div className="w-16 border-r border-[#323131] bg-[#252525] sticky left-0 z-10">
              {HOURS.map((hour) => (
                <div key={hour} className="h-20 border-b border-[#323131] px-2 py-1">
                  <span className="text-xs text-gray-400">{format(setHours(date, hour), "ha")}</span>
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="relative">
              {/* Day Headers */}
              <div className="grid grid-cols-5 border-b border-[#323131] bg-[#252525] sticky top-0 z-10">
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "px-2 py-2 text-center border-r border-[#323131]",
                      isSameDay(day, new Date()) && "bg-[#2F7FE6]/10",
                    )}
                  >
                    <div className="text-sm font-medium">{format(day, "EEE", { locale: dateLocale })}</div>
                    <div className={cn("text-xl mt-1", isSameDay(day, new Date()) && "text-[#2F7FE6]")}>
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <ScrollArea className="h-[calc(100%-3rem)]">
                <div className="relative grid grid-cols-5">
                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "relative border-r border-[#323131]",
                        isSameDay(day, new Date()) && "bg-[#2F7FE6]/5",
                      )}
                    >
                      {/* Hour cells */}
                      {HOURS.map((hour) => (
                        <div key={hour} className="h-20 border-b border-[#323131] relative">
                          {/* Half-hour marker */}
                          <div className="absolute top-1/2 left-0 right-0 border-t border-dotted border-[#323131]" />
                        </div>
                      ))}

                      {/* Tasks */}
                      {tasksByDay[dayIndex]?.tasks.map((task) => {
                        const { top, height } = getTaskPosition(task.deadline)
                        const style = STATUS_STYLES[task.status]

                        return (
                          <div
                            key={task._id}
                            className={cn(
                              "absolute left-1 right-1 p-2 rounded-md",
                              style.color,
                              style.text,
                              "cursor-pointer transition-all duration-200",
                              "hover:shadow-lg",
                              "group",
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              zIndex: 1,
                            }}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="font-medium truncate">{task.title}</div>
                            <div className="text-xs opacity-90 truncate flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(task.deadline), "h:mm a")}
                            </div>

                            {/* Quick actions on hover */}
                            <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-white/20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleTaskClick(task)
                                    }}
                                  >
                                    {t("edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {Object.entries(STATUS_STYLES).map(([status, style]) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(task._id, status)
                                      }}
                                      className={task.status === status ? "bg-muted" : ""}
                                    >
                                      <style.icon className="mr-2 h-4 w-4" />
                                      {style.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      })}

                      {/* Current time indicator */}
                      {isSameDay(day, new Date()) && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                          style={{
                            top: `${(getHours(new Date()) - 9) * HOUR_HEIGHT + getMinutes(new Date()) * MINUTE_HEIGHT}px`,
                          }}
                        >
                          <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      {/* Task Edit Dialog */}
      <TaskEditDialog
        task={selectedTask}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setSelectedTask(null)
            loadTasks() // Refresh tasks when dialog closes
          }
        }}
        onTaskUpdated={(updatedTask) => {
          setTasks(tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
          setIsEditDialogOpen(false)
          toast({
            title: t("success"),
            description: t("taskUpdated"),
          })
        }}
      />
    </div>
  )
}

