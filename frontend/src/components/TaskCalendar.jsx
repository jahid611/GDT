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

// Configuration
const locales = { fr, en: enUS, ro }
const AUTO_REFRESH_INTERVAL = 30000
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)
const HOUR_HEIGHT = 60
const MINUTE_HEIGHT = HOUR_HEIGHT / 60

// Palette pastel pour les statuts
const STATUS_STYLES = {
  todo: {
    color: "bg-red-200 hover:bg-red-300",
    border: "border border-red-300",
    text: "text-red-700",
    icon: AlertTriangle,
    label: "À faire",
  },
  in_progress: {
    color: "bg-blue-200 hover:bg-blue-300",
    border: "border border-blue-300",
    text: "text-blue-700",
    icon: Clock,
    label: "En cours",
  },
  review: {
    color: "bg-yellow-200 hover:bg-yellow-300",
    border: "border border-yellow-300",
    text: "text-yellow-700",
    icon: Eye,
    label: "En révision",
  },
  done: {
    color: "bg-green-200 hover:bg-green-300",
    border: "border border-green-300",
    text: "text-green-700",
    icon: CheckCircle2,
    label: "Terminé",
  },
}

// Composant pour la prévisualisation d'un document ou d'une image
function PreviewModal({ previewImage, isOpen, setIsOpen }) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] overflow-auto p-4">
        <DialogHeader>
          <DialogTitle>Prévisualisation</DialogTitle>
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

// Composant pour le mini calendrier dans la sidebar
function MiniCalendar({ selectedDate, onSelect, currentMonth, setCurrentMonth, tasks }) {
  const dateLocale = locales.fr
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

  return (
    <div className="p-4 bg-background border rounded-md">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
            )
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center font-semibold">
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
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground">
            {day}
          </div>
        ))}
        {weekRows.map((week, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {week.map((day, colIndex) => {
              if (!day) return <div key={colIndex} className="py-1" />
              const hasTasks = tasks?.some(
                (task) => task.deadline && isSameDay(parseISO(task.deadline), day)
              )
              return (
                <button
                  key={colIndex}
                  onClick={() => onSelect(day)}
                  className={cn(
                    "py-1 w-full rounded text-sm",
                    isSameDay(day, selectedDate)
                      ? "bg-primary text-primary-foreground"
                      : hasTasks
                      ? "bg-green-500/20 hover:bg-green-500/30 text-foreground"
                      : "bg-transparent hover:bg-accent text-foreground"
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

// Composant dédié à l'affichage d'une carte de tâche.
// Il augmente son z-index lorsqu'il est survolé afin d'être visible au-dessus des autres tâches.
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
        {format(parseISO(task.deadline), "h:mm a")}
      </div>
      <div className="hidden sm:block text-[8px] sm:text-[10px] mt-1">
        <span className="font-semibold">{t("assignedTo")}: </span>
        {task.assignedTo?.name || task.assignedTo?.email || t("unassigned")}
      </div>

      {/* Actions sur la tâche */}
      <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-accent"
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

// Composant principal du calendrier des tâches
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

  // Chargement des tâches
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

  // Calcul des jours de la semaine
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

  // Regroupement des tâches par jour
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
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()))
          return false
        return isWithinInterval(taskDate, { start: dayStart, end: dayEnd })
      })
      return {
        date: day,
        tasks: dayTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
      }
    })
  }, [tasks, weekDays, filterStatus, searchQuery])

  // Calcul de la position d'une tâche dans la grille horaire
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

  // Gestion des événements
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

  // Contenu de la sidebar
  function SidebarContent() {
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
        />
        <div>
          <Input
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-between gap-2"
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
                  "w-full justify-between gap-2",
                  filterStatus === statusKey && "bg-accent"
                )}
                onClick={() => {
                  setFilterStatus(statusKey)
                  setIsSidebarOpen(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
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
  }

  return (
    <>
      <PreviewModal
        previewImage={previewImage}
        isOpen={isPreviewOpen}
        setIsOpen={setIsPreviewOpen}
      />

      <div className="flex flex-col h-screen">
        {/* Barre supérieure */}
        <div className="flex justify-between items-center p-2 bg-background border-b">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>{t("calendar")}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex flex-1 overflow-hidden bg-background m-4 rounded-xl border">
          {/* Sidebar - cachée sur mobile */}
          <div className="hidden md:flex w-64 border-r flex-col gap-4 p-4">
            <SidebarContent />
          </div>

          {/* Grille du calendrier */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* En-tête de la semaine */}
            <div className="sticky top-0 z-20 bg-background border-b">
              <div className="grid grid-cols-7">
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="flex flex-col items-center justify-center border-r p-2"
                  >
                    <div className="text-xs sm:text-sm font-medium">
                      {format(day, "EEE", { locale: dateLocale })}
                    </div>
                    <div className="text-lg sm:text-xl">
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grille horaire */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr] min-h-full">
                {/* Colonne des heures */}
                <div className="w-12 sm:w-16 border-r sticky left-0 z-10 bg-background">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-b px-1 sm:px-2 py-1"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                      <span className="text-[10px] sm:text-xs">
                        {format(setHours(date, hour), "ha")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grille des tâches */}
                <ScrollArea className="h-full">
                  <div
                    className="relative grid"
                    style={{
                      gridTemplateColumns: `repeat(${weekDays.length}, 1fr)`,
                    }}
                  >
                    {weekDays.map((day, dayIndex) => (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "relative border-r",
                          isSameDay(day, date) && "bg-accent/5"
                        )}
                      >
                        {/* Lignes horaires */}
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            className="border-b relative"
                            style={{ height: `${HOUR_HEIGHT}px` }}
                          >
                            <div className="absolute top-1/2 left-0 right-0 border-t border-dotted border-border" />
                          </div>
                        ))}

                        {/* Affichage des tâches */}
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

                        {/* Indicateur de l'heure actuelle */}
                        {isSameDay(day, new Date()) && (
                          <div
                            className="absolute left-0 right-0 border-t-2 border-primary z-10"
                            style={{
                              top: `${
                                (getHours(new Date()) - 8) * HOUR_HEIGHT +
                                getMinutes(new Date()) * MINUTE_HEIGHT
                              }px`,
                            }}
                          >
                            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-primary" />
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
