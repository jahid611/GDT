import React, { useState, useEffect } from "react"
import { fetchTasks } from "../utils/api"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function TaskCalendar() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const tasksData = await fetchTasks()
        setTasks(tasksData)
      } catch (err) {
        console.error("Erreur lors du chargement des tâches:", err)
        setError(err.message || "Une erreur est survenue lors du chargement des tâches")
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

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
        <h2 className="text-xl font-bold">Calendrier des tâches</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={fr} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Tâches pour le {format(date, "d MMMM yyyy", { locale: fr })}:</h3>
        <div className="space-y-2">
          {tasksForDate(date).length === 0 ? (
            <p className="text-muted-foreground">Aucune tâche pour cette date</p>
          ) : (
            tasksForDate(date).map((task) => (
              <div key={task._id} className="p-2 bg-muted rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(task.deadline), "HH:mm", { locale: fr })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}

