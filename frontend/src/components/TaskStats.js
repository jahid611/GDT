import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { CheckCircle2, Clock, AlertCircle, Activity } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

export default function TaskStats() {
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    overdue: 0,
    averageCompletionTime: 0,
  })
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/tasks/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        const data = await response.json()
        setStats(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching stats:", error)
        setLoading(false)
      }
    }

    fetchStats()
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: t("completedTasks"),
      value: stats.completed,
      description: t("completedTasksDesc"),
      icon: CheckCircle2,
      color: "text-green-500",
      trend: t("thisMonth"),
    },
    {
      title: t("tasksInProgress"),
      value: stats.inProgress,
      description: t("tasksInProgressDesc"),
      icon: Activity,
      color: "text-blue-500",
      trend: t("currently"),
    },
    {
      title: t("overdueTasks"),
      value: stats.overdue,
      description: t("overdueTasksDesc"),
      icon: AlertCircle,
      color: "text-red-500",
      trend: t("toProcess"),
    },
    {
      title: t("averageTime"),
      value: `${stats.averageCompletionTime}j`,
      description: t("averageCompletionTimeDesc"),
      icon: Clock,
      color: "text-orange-500",
      trend: t("perTask"),
    },
  ]

  if (loading) {
    return <div>{t("loadingStats")}</div>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

