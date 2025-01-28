import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertCircle, Activity, RefreshCcw } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getTaskStats } from "../utils/api"

export default function TaskStats() {
  const [stats, setStats] = useState({
    completed: { value: 0, trend: 0 },
    inProgress: { value: 0, trend: 0 },
    overdue: { value: 0, trend: 0 },
    averageCompletionTime: { value: 0, trend: 0 },
    lastUpdated: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setUpdating(true)
      setError(null)
      
      const data = await getTaskStats()
      
      setStats(prevStats => ({
        completed: {
          value: data.completed,
          trend: prevStats.completed.value !== 0 
            ? data.completed - prevStats.completed.value 
            : 0
        },
        inProgress: {
          value: data.inProgress,
          trend: prevStats.inProgress.value !== 0 
            ? data.inProgress - prevStats.inProgress.value 
            : 0
        },
        overdue: {
          value: data.overdue,
          trend: prevStats.overdue.value !== 0 
            ? data.overdue - prevStats.overdue.value 
            : 0
        },
        averageCompletionTime: {
          value: data.averageCompletionTime,
          trend: prevStats.averageCompletionTime.value !== 0 
            ? data.averageCompletionTime - prevStats.averageCompletionTime.value 
            : 0
        },
        lastUpdated: data.lastUpdated
      }))
    } catch (error) {
      console.error("Error fetching stats:", error)
      setError(error.message)
    } finally {
      setLoading(false)
      setUpdating(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const statCards = [
    {
      title: "Tâches terminées",
      value: stats.completed.value,
      trend: stats.completed.trend,
      description: "Tâches complétées ce mois",
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "En cours",
      value: stats.inProgress.value,
      trend: stats.inProgress.trend,
      description: "Tâches en progression",
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "En retard",
      value: stats.overdue.value,
      trend: stats.overdue.trend,
      description: "Tâches dépassant la deadline",
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Temps moyen",
      value: `${stats.averageCompletionTime.value}j`,
      trend: stats.averageCompletionTime.trend,
      description: "Temps moyen de complétion",
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4 text-destructive">
        <p>{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 inline-flex items-center text-sm hover:underline"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="wait">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden ${updating ? 'opacity-80' : ''}`}>
                <div
                  className={`absolute inset-0 opacity-10 ${stat.bgColor}`}
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 85%)'
                  }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline space-x-2">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.trend !== 0 && (
                      <span className={`text-xs ${stat.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.trend > 0 ? '+' : ''}{stat.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {stats.lastUpdated && (
        <p className="text-xs text-muted-foreground text-right">
          Dernière mise à jour : {format(new Date(stats.lastUpdated), "PPp", { locale: fr })}
        </p>
      )}
    </div>
  )
}