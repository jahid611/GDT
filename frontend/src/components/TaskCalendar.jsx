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
import { enUS } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "../hooks/useTranslation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// ====================================
// Configuration & Constants
// ====================================
const AUTO_REFRESH_INTERVAL = 30000
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // from 8am to 8pm
const HOUR_HEIGHT = 60
const MINUTE_HEIGHT = HOUR_HEIGHT / 60

// Pastel palette for statuses
const STATUS_STYLES = {
  todo: {
    color: "bg-red-200 hover:bg-red-300",
    border: "border border-red-300",
    text: "text-red-700",
    icon: AlertTriangle,
    label: "To Do",
  },
  in_progress: {
    color: "bg-blue-200 hover:bg-blue-300",
    border: "border border-blue-300",
    text: "text-blue-700",
    icon: Clock,
    label: "In Progress",
  },
  review: {
    color: "bg-yellow-200 hover:bg-yellow-300",
    border: "border border-yellow-300",
    text: "text-yellow-700",
    icon: Eye,
    label: "In Review",
  },
  done: {
    color: "bg-green-200 hover:bg-green-300",
    border: "border border-green-300",
    text: "text-green-700",
    icon: CheckCircle2,
    label: "Done",
  },
}

// ====================================
// PreviewModal Component
// ====================================
function PreviewModal({ previewImage, isOpen, setIsOpen }) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] overflow-auto p-4">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        {previewImage?.toLowerCase().endsWith(".pdf") ? (
          <iframe
            src={previewImage}
            className="w-full h-[70vh]"
            title="PDF Preview"
          />
        ) : (
          <img
            src={previewImage || "/placeholder.svg"}
            alt="Preview"
            className="w-full h-auto object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ====================================
// MiniCalendar Component
// ====================================
function MiniCalendar({
  selectedDate,
  onSelect,
  currentMonth,
  setCurrentMonth,
  tasks,
  maintenanceFilter,
}) {
  const dateLocale = enUS
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startWeekDay = (monthStart.getDay() + 6) % 7
  const totalSlots = startWeekDay + daysInMonth.length
  const slots = Array.from({ length: totalSlots }, (_, i) =>
    i < startWeekDay ? null : daysInMonth[i - startWeekDay]
  )
  const weekRows = Array.from({ length: Math.ceil(slots.length / 7) }, (_, i) =>
    slots.slice(i * 7, (i + 1) * 7)
  )

  // Days of the week in English
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="p-4 bg-[#f5f5f5] dark:bg-[#1c1c1c] border border-[#333333] dark:border-[#444444] rounded-md">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
            )
          }
          className="text-[#333333] dark:text-[#dddddd]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center font-semibold text-[#333333] dark:text-[#dddddd]">
          {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
            )
          }
          className="text-[#333333] dark:text-[#dddddd]"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-[#333333]/70 dark:text-[#cccccc]/70 font-semibold"
          >
            {day}
          </div>
        ))}

        {weekRows.map((week, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {week.map((day, colIndex) => {
              if (!day) return <div key={colIndex} className="py-1" />
              // For coloring the day if it has tasks (depending on maintenance logic)
              const hasTasks = tasks?.some((task) => {
                if (!task.deadline) return false
                // Inverted logic: If maintenanceFilter is false => exclude Maintenance
                if (!maintenanceFilter && task.title?.startsWith("Maintenance |")) {
                  return false
                }
                // If maintenanceFilter is true => only include Maintenance tasks
                if (maintenanceFilter && !task.title?.startsWith("Maintenance |")) {
                  return false
                }
                return isSameDay(parseISO(task.deadline), day)
              })

              const isSelected = isSameDay(day, selectedDate)
              return (
                <button
                  key={colIndex}
                  onClick={() => onSelect(day)}
                  className={cn(
                    "py-1 w-full rounded text-sm font-medium border border-transparent transition-colors",
                    isSelected
                      ? "bg-[#b7b949] text-white dark:text-white"
                      : hasTasks
                      ? "bg-[#b7b949]/20 hover:bg-[#b7b949]/30 text-[#333333] dark:text-[#dddddd]"
                      : "bg-transparent hover:bg-[#333333]/10 dark:hover:bg-[#444444] text-[#333333] dark:text-[#dddddd]"
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

// ====================================
// SidebarContent (memoized)
// ====================================
const SidebarContent = React.memo(function SidebarContent({
  t,
  tasks,
  date,
  setDate,
  currentMonth,
  setCurrentMonth,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  maintenanceFilter,
  setIsSidebarOpen,
}) {
  return (
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
        maintenanceFilter={maintenanceFilter}
      />
      <div>
        <Input
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between gap-2 border-[#333333] dark:border-[#444444]"
          onClick={() => {
            setFilterStatus("all")
            setIsSidebarOpen(false)
          }}
        >
          <span>All Tasks</span>
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
                "w-full justify-between gap-2 border-[#333333] dark:border-[#444444]",
                filterStatus === statusKey && "bg-[#333333]/20 dark:bg-[#444444]/30"
              )}
              onClick={() => {
                setFilterStatus(statusKey)
                setIsSidebarOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#333333] dark:text-[#cccccc]" />
                <span className="text-[#333333] dark:text-[#dddddd]">
                  {styleObj.label}
                </span>
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
})

// ====================================
// TaskCard Component
// ====================================
function TaskCard({ task, top, height, style, handleTaskClick, handleStatusChange, t }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ top: `${top}px`, minHeight: `${height}px`, zIndex: hovered ? 10 : 1 }}
      className={cn(
        "absolute left-1 right-1 sm:left-2 sm:right-2 p-2 sm:p-3 rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg group border shadow-sm",
        style.color,
        style.text,
        style.border
      )}
      onClick={() => handleTaskClick(task)}
    >
      <div className="font-semibold text-xs sm:text-sm md:text-base line-clamp-2">
        {task.title}
      </div>
      <div className="text-[10px] sm:text-xs mt-1 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {task.deadline ? format(parseISO(task.deadline), "h:mm a") : "No Deadline"}
      </div>
      <div className="hidden sm:block text-[8px] sm:text-[10px] mt-1">
        <span className="font-semibold">Assigned to: </span>
        {task.assignedTo?.name || task.assignedTo?.email || "Unassigned"}
      </div>

      {/* Actions Menu */}
      <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-[#333333]/10 dark:hover:bg-[#444444]"
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
              Edit
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
                  className={task.status === statusKey ? "bg-accent" : ""}
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
}

// ====================================
// Main Component: TaskCalendar
// ====================================
export default function TaskCalendar() {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date()) // state for selected day
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [maintenanceFilter, setMaintenanceFilter] = useState(false)

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const tasksData = await fetchTasks()
      setTasks(tasksData)
    } catch (error) {
      console.error("Failed to load tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    const interval = setInterval(loadTasks, AUTO_REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [loadTasks])

  // Calculate the days of the current week (Mon -> Sun)
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

  // Filter tasks by day
  const tasksByDay = useMemo(() => {
    if (!weekDays.length) return []
    return weekDays.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const dayTasks = tasks.filter((task) => {
        // Exclude if no deadline
        if (!task.deadline) return false

        // Inverted maintenance logic:
        // If maintenanceFilter = false => exclude "Maintenance |"
        // If maintenanceFilter = true => only "Maintenance |"
        if (!maintenanceFilter && task.title?.startsWith("Maintenance |")) {
          return false
        } else if (maintenanceFilter && !task.title?.startsWith("Maintenance |")) {
          return false
        }

        // Filter by status
        if (filterStatus !== "all" && task.status !== filterStatus) return false

        // Filter by search
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()))
          return false

        // Check date interval
        const taskDate = parseISO(task.deadline)
        if (!isValid(taskDate)) return false
        return isWithinInterval(taskDate, { start: dayStart, end: dayEnd })
      })

      return {
        date: day,
        tasks: dayTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
      }
    })
  }, [tasks, weekDays, filterStatus, searchQuery, maintenanceFilter])

  // Position of a task in the hourly grid
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

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsEditDialogOpen(true)
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTask = await updateTask(taskId, { status: newStatus })
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === taskId ? updatedTask : task))
      )
      toast({
        title: "Success",
        description: "Status updated",
      })
    } catch (error) {
      console.error("Failed to update task status:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "My Task Calendar",
          text: "Check out my task calendar.",
          url: window.location.href,
        })
        .catch((error) => console.error("Share failed:", error))
    } else {
      toast({
        title: "Error",
        description: "Sharing is not supported on this device",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <PreviewModal
        previewImage={previewImage}
        isOpen={isPreviewOpen}
        setIsOpen={setIsPreviewOpen}
      />

      <div className="flex flex-col h-screen bg-white dark:bg-[#1c1c1c]">
        {/* Top bar */}
        <div className="flex justify-between items-center p-2 bg-[#b7b949] dark:bg-[#999d41] border-b border-[#333333] dark:border-[#444444]">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-[#333333] dark:text-[#dddddd]">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-[#f5f5f5] dark:bg-[#1c1c1c] border-l border-[#333333] dark:border-[#444444]">
              <SheetHeader>
                <SheetTitle className="text-[#333333] dark:text-[#dddddd]">
                  Calendar
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <SidebarContent
                  t={t}
                  tasks={tasks}
                  date={date}
                  setDate={setDate}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  maintenanceFilter={maintenanceFilter}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={maintenanceFilter ? "secondary" : "ghost"}
              onClick={() => setMaintenanceFilter(!maintenanceFilter)}
              className="text-[#333333] dark:text-[#dddddd] border-[#333333] dark:border-[#444444]"
            >
              {maintenanceFilter ? "Show All Tasks" : "Maintenance Calendar"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-[#333333] dark:text-[#dddddd]"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.print()}
              className="text-[#333333] dark:text-[#dddddd]"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden bg-[#f2f2f2] dark:bg-[#222222] m-4 rounded-xl border border-[#333333] dark:border-[#444444]">
          {/* Sidebar (desktop) */}
          <div className="hidden md:flex w-64 border-r border-[#333333] dark:border-[#444444] flex-col gap-4 p-4 bg-[#f5f5f5] dark:bg-[#1c1c1c]">
            <SidebarContent
              t={t}
              tasks={tasks}
              date={date}
              setDate={setDate}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              maintenanceFilter={maintenanceFilter}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          </div>

          {/* Calendar grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Week header aligned with the grid */}
            <div className="sticky top-0 z-20 bg-[#f5f5f5] dark:bg-[#1c1c1c] border-b border-[#333333] dark:border-[#444444]">
              <div className="grid grid-cols-[auto_repeat(7,_1fr)]">
                {/* Empty column to align with hours column */}
                <div className="w-12 sm:w-16 border-b border-[#333333] dark:border-[#444444] bg-[#f5f5f5] dark:bg-[#1c1c1c]" />
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="border-b border-[#333333] dark:border-[#444444] flex flex-col items-center justify-center p-2 bg-[#f5f5f5] dark:bg-[#1c1c1c]"
                  >
                    <div className="text-xs sm:text-sm font-medium text-[#333333] dark:text-[#dddddd]">
                      {format(day, "EEE", { locale: enUS })}
                    </div>
                    <div className="text-lg sm:text-xl text-[#333333] dark:text-[#dddddd]">
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly grid */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr] min-h-full">
                {/* Hours column */}
                <div className="w-12 sm:w-16 border-r border-[#333333] dark:border-[#444444] sticky left-0 z-10 bg-[#f5f5f5] dark:bg-[#1c1c1c] row-start-2 col-start-1">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-[#333333]/30 dark:border-[#444444]/40 px-1 sm:px-2 py-1"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                      <span className="text-[10px] sm:text-xs text-[#333333] dark:text-[#cccccc]">
                        {format(setHours(date, hour), "ha")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tasks column */}
                <div className="row-start-2 col-start-2 col-span-7 relative overflow-hidden">
                  <ScrollArea className="h-full">
                    <div
                      className="relative grid"
                      style={{ gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }}
                    >
                      {weekDays.map((day, dayIndex) => (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "relative border-r border-[#333333]/30 dark:border-[#444444]/40",
                            isSameDay(day, date) && "bg-[#b7b949]/10"
                          )}
                        >
                          {/* Hour lines */}
                          {HOURS.map((hour) => (
                            <div
                              key={hour}
                              className="border-b border-dotted border-[#333333]/30 dark:border-[#444444]/40 relative"
                              style={{ height: `${HOUR_HEIGHT}px` }}
                            >
                              <div className="absolute top-1/2 left-0 right-0 border-t border-dotted border-[#333333]/30 dark:border-[#444444]/40" />
                            </div>
                          ))}
                          {/* Display tasks */}
                          {tasksByDay[dayIndex]?.tasks.map((task) => {
                            const { top, height } = getTaskPosition(task.deadline)
                            const styleObj = STATUS_STYLES[task.status]
                            return (
                              <TaskCard
                                key={task._id}
                                task={task}
                                top={top}
                                height={height}
                                style={styleObj}
                                handleTaskClick={handleTaskClick}
                                handleStatusChange={handleStatusChange}
                                t={t}
                              />
                            )
                          })}
                          {/* Current time indicator */}
                          {isSameDay(day, new Date()) && (
                            <div
                              className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                              style={{
                                top: `${
                                  (getHours(new Date()) - 8) * HOUR_HEIGHT +
                                  getMinutes(new Date()) * MINUTE_HEIGHT
                                }px`,
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
        </div>
      </div>
    </>
  )
}
