"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { fetchTasks, updateTask } from "../utils/api"
import {
  Clock,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Share2,
  Printer,
  Menu,
} from "lucide-react"
import {
  format,
  isSameDay,
  addDays,
  isWithinInterval,
  startOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  getHours,
  getMinutes,
  setHours,
  parseISO,
  isValid,
} from "date-fns"
import { fr, enUS, ro } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "../hooks/useTranslation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Configuration
const locales = { fr, en: enUS, ro }
const AUTO_REFRESH_INTERVAL = 30000
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)
const HOUR_HEIGHT = 60 // Reduced height for mobile
const MINUTE_HEIGHT = HOUR_HEIGHT / 60

// Status styles
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

// Preview Modal Component
const PreviewModal = ({ previewImage, isOpen, setIsOpen }) => (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] overflow-auto p-4">
      <DialogHeader>
        <DialogTitle className="text-white">Prévisualisation</DialogTitle>
      </DialogHeader>
      {previewImage?.toLowerCase().endsWith(".pdf") ? (
        <iframe src={previewImage} className="w-full h-[70vh]" title="PDF Preview" />
      ) : (
        <img src={previewImage || "/placeholder.svg"} alt="Preview" className="w-full h-auto object-contain" />
      )}
    </DialogContent>
  </Dialog>
)

// Mini Calendar Component
const MiniCalendar = ({ selectedDate, onSelect, currentMonth, setCurrentMonth, tasks }) => {
  const dateLocale = locales.fr
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startWeekDay = (monthStart.getDay() + 6) % 7
  const totalSlots = startWeekDay + daysInMonth.length
  const slots = Array.from({ length: totalSlots }, (_, i) => (i < startWeekDay ? null : daysInMonth[i - startWeekDay]))
  const weekRows = Array.from({ length: Math.ceil(slots.length / 7) }, (_, i) => slots.slice(i * 7, (i + 1) * 7))

  return (
    <div className="p-4 bg-[#252525] rounded-md border border-white">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4 text-white" />
        </Button>
        <div className="text-center text-white font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4 text-white" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
          <div key={day} className="text-center text-xs text-white">
            {day}
          </div>
        ))}
        {weekRows.map((week, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {week.map((day, colIndex) => {
              if (!day) return <div key={colIndex} className="py-1" />
              const hasTasks = tasks?.some((task) => task.deadline && isSameDay(parseISO(task.deadline), day))
              return (
                <button
                  key={colIndex}
                  onClick={() => onSelect(day)}
                  className={cn(
                    "py-1 w-full rounded text-sm",
                    isSameDay(day, selectedDate)
                      ? "bg-[#2F7FE6] text-white"
                      : hasTasks
                        ? "bg-green-500/20 text-white hover:bg-green-500/30"
                        : "bg-transparent text-white hover:bg-gray-700",
                  )}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// Main Calendar Component
export default function TaskCalendar() {
  const { t, language } = useTranslation()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const dateLocale = locales[language] || enUS

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const tasksData = await fetchTasks()
      setTasks(tasksData)
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
    const interval = setInterval(loadTasks, AUTO_REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [loadTasks])

  // Calculate week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = addDays(start, 6)
    if (!isValid(start) || !isValid(end)) return []
    try {
      return eachDayOfInterval({ start, end })
    } catch (error) {
      console.error("Error calculating week days:", error)
      return []
    }
  }, [date])

  // Group tasks by day
  const tasksByDay = useMemo(() => {
    if (!weekDays.length) return []
    return weekDays.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const dayTasks = tasks.filter((task) => {
        if (!task.deadline) return false
        const taskDate = parseISO(task.deadline)
        if (!isValid(taskDate)) return false
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

  // Calculate task position
  const getTaskPosition = (deadline) => {
    const taskDate = parseISO(deadline)
    if (!isValid(taskDate)) return { top: 0, height: HOUR_HEIGHT }
    const hours = getHours(taskDate) - 8
    const minutes = getMinutes(taskDate)
    return {
      top: hours * HOUR_HEIGHT + minutes * MINUTE_HEIGHT,
      height: HOUR_HEIGHT,
    }
  }

  // Event handlers
  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTask = await updateTask(taskId, { status: newStatus })
      setTasks((prevTasks) => prevTasks.map((task) => (task._id === taskId ? updatedTask : task)))
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

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Mon Calendrier de Tâches",
          text: "Découvrez mon calendrier de tâches.",
          url: window.location.href,
        })
        .catch((error) => console.error("Share failed:", error))
    } else {
      toast({
        title: t("error"),
        description: t("shareNotSupported"),
        variant: "destructive",
      })
    }
  }

  // Sidebar content
  const SidebarContent = () => (
    <div className="space-y-4">
      <MiniCalendar
        selectedDate={date}
        onSelect={(newDate) => {
          setDate(newDate)
          setIsSidebarOpen(false)
        }}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        tasks={tasks}
      />
      <div>
        <Input
          placeholder={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#252525] border border-white text-white"
        />
      </div>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between gap-2 rounded-md border border-white px-2 py-1"
          onClick={() => {
            setFilterStatus("all")
            setIsSidebarOpen(false)
          }}
        >
          <span>{t("allTasks")}</span>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </Button>
        {Object.entries(STATUS_STYLES).map(([statusKey, styleObj]) => {
          const Icon = styleObj.icon
          const count = tasks.filter((t) => t.status === statusKey).length
          return (
            <Button
              key={statusKey}
              variant="outline"
              className={cn(
                "w-full justify-between gap-2 rounded-md border border-white px-2 py-1",
                filterStatus === statusKey && "bg-white/20",
              )}
              onClick={() => {
                setFilterStatus(statusKey)
                setIsSidebarOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-white" />
                <span>{styleObj.label}</span>
              </div>
              <Badge variant="secondary" className="ml-2">
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      <PreviewModal previewImage={previewImage} isOpen={isPreviewOpen} setIsOpen={setIsPreviewOpen} />

      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex justify-between items-center p-2 bg-[#252525] border-b border-white">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-4 w-4 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-[#252525] p-4">
              <SheetHeader>
                <SheetTitle className="text-white">{t("calendar")}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4 text-white" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.print()}>
              <Printer className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden bg-[#B7B949] text-white rounded-xl border border-white m-4">
          {/* Sidebar - hidden on mobile */}
          <div className="hidden md:flex w-64 border-r border-white flex-col gap-4 p-4">
            <SidebarContent />
          </div>

          {/* Calendar grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Week header */}
            <div className="sticky top-0 z-20 bg-[#252525] border-b border-white">
              <div className="grid grid-cols-7">
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="flex flex-col items-center justify-center border-r border-white p-2"
                  >
                    <div className="text-xs sm:text-sm font-medium">{format(day, "EEE", { locale: dateLocale })}</div>
                    <div className="text-lg sm:text-xl">{format(day, "d")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time grid */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr] min-h-full">
                {/* Hours column */}
                <div className="w-12 sm:w-16 border-r border-white bg-[#252525] sticky left-0 z-10">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-white px-1 sm:px-2 py-1"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                      <span className="text-[10px] sm:text-xs">{format(setHours(date, hour), "ha")}</span>
                    </div>
                  ))}
                </div>

                {/* Tasks grid */}
                <ScrollArea className="h-full">
                  <div className="relative grid" style={{ gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }}>
                    {weekDays.map((day, dayIndex) => (
                      <div
                        key={day.toISOString()}
                        className={cn("relative border-r border-white", isSameDay(day, date) && "bg-[#2F7FE6]/5")}
                      >
                        {/* Hour lines */}
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            className="border-b border-white relative"
                            style={{ height: `${HOUR_HEIGHT}px` }}
                          >
                            <div className="absolute top-1/2 left-0 right-0 border-t border-dotted border-white" />
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
                                "absolute left-0.5 right-0.5 sm:left-1 sm:right-1 p-2 sm:p-4 rounded-lg cursor-pointer transition-transform hover:scale-105 hover:shadow-xl group border border-white/20",
                                style.color,
                                style.text,
                              )}
                              style={{ top: `${top}px`, minHeight: `${height}px`, zIndex: 1 }}
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="font-semibold text-xs sm:text-sm md:text-base line-clamp-2">
                                {task.title}
                              </div>
                              <div className="text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(task.deadline), "h:mm a")}
                              </div>
                              <div className="hidden sm:block text-[8px] sm:text-[10px] mt-1">
                                <span className="font-semibold">{t("assignedTo")}: </span>
                                {task.assignedTo?.name || task.assignedTo?.email || t("unassigned")}
                              </div>

                              {/* Task actions */}
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
                                    {Object.entries(STATUS_STYLES).map(([statusKey, styleObj]) => {
                                      const Icon = styleObj.icon
                                      return (
                                        <DropdownMenuItem
                                          key={statusKey}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleStatusChange(task._id, statusKey)
                                          }}
                                          className={task.status === statusKey ? "bg-muted" : ""}
                                        >
                                          <Icon className="mr-2 h-4 w-4" />
                                          {styleObj.label}
                                        </DropdownMenuItem>
                                      )
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )
                        })}

                        {/* Current time indicator */}
                        {isSameDay(day, new Date()) && (
                          <div
                            className="absolute left-0 right-0 border-t-2 border-[#2F7FE6] z-10"
                            style={{
                              top: `${
                                (getHours(new Date()) - 8) * HOUR_HEIGHT + getMinutes(new Date()) * MINUTE_HEIGHT
                              }px`,
                            }}
                          >
                            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-[#2F7FE6]" />
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
      </div>
    </>
  )
}

