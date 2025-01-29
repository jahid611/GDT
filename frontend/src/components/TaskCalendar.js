import React, { useState, useEffect } from "react"
import { fetchTasks } from "../utils/api"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale" // Added enUS
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslation } from "../hooks/useTranslation"

export default function TaskCalendar() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(new Date())
  const { t, language } = useTranslation()

  const dateLocale = language === "fr" ? fr : enUS

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const tasksData = await fetchTasks()
        setTasks(tasksData)
      } catch (err) {
        console.error("Error loading tasks:", err)
        setError(err.message || t("cannotLoadTasks"))
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [t])

  const tasksForDate = (date) => {
    return tasks.filter((task) => {
      if (!task.deadline) return false
      const taskDate = new Date(task.deadline)
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      )
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t("taskCalendar")}</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP", { locale: dateLocale })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={dateLocale} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">
          {t("tasksForDate")} {format(date, "d MMMM yyyy", { locale: dateLocale })}:
        </h3>
        <div className="space-y-2">
          {tasksForDate(date).length === 0 ? (
            <p className="text-muted-foreground">{t("noTasksForDate")}</p>
          ) : (
            tasksForDate(date).map((task) => (
              <div key={task._id} className="p-2 bg-muted rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(task.deadline), "HH:mm", { locale: dateLocale })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}

