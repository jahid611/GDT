"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchTasks } from "../utils/api"
import { format, isBefore, differenceInDays, parseISO, subDays, subMonths } from "date-fns"
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  PieChart,
  RefreshCw,
  Star,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  PieChart as RechartsePie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts"

/**
 * ----------------------------
 * THEME & COLOR SETTINGS
 * ----------------------------
 */
const CHART_COLORS = {
  primary: {
    main: "hsl(var(--primary))",
    light: "hsl(var(--primary) / 0.2)",
    dark: "hsl(var(--primary) / 0.8)",
    gradient: ["hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.2)"],
  },
  todo: {
    main: "#ef4444",
    light: "#fee2e2",
    dark: "#b91c1c",
    gradient: ["#ef4444", "#fee2e2"],
  },
  inProgress: {
    main: "#3b82f6",
    light: "#dbeafe",
    dark: "#1d4ed8",
    gradient: ["#3b82f6", "#dbeafe"],
  },
  review: {
    main: "#f59e0b",
    light: "#fef3c7",
    dark: "#b45309",
    gradient: ["#f59e0b", "#fef3c7"],
  },
  done: {
    main: "#10b981",
    light: "#d1fae5",
    dark: "#047857",
    gradient: ["#10b981", "#d1fae5"],
  },
  high: {
    main: "#dc2626",
    light: "#fee2e2",
    dark: "#991b1b",
    gradient: ["#dc2626", "#fee2e2"],
  },
  medium: {
    main: "#f59e0b",
    light: "#fef3c7",
    dark: "#b45309",
    gradient: ["#f59e0b", "#fef3c7"],
  },
  low: {
    main: "#10b981",
    light: "#d1fae5",
    dark: "#047857",
    gradient: ["#10b981", "#d1fae5"],
  },
}

const DEFAULT_AVATAR =
  "https://api.dicebear.com/7.x/initials/svg?seed=??&backgroundColor=52,53,65,255"

/**
 * ------------------------------------
 * STAT CARD COMPONENT
 * ------------------------------------
 * Modification : la classe "text-3xl font-extrabold" est remplacée par "text-xl font-normal"
 * pour enlever le gras et diminuer la taille de la police des nombres.
 */
function StatCard({ icon: Icon, label, value, trend, description, explanation, color, progress }) {
  return (
    <Card className="relative overflow-hidden transition-transform transform rounded-lg hover:shadow-2xl hover:scale-105 group">
      {/* Fond neutre pour l'icône */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <div className="p-2 rounded-full bg-gray-200">
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          {label}
        </CardTitle>
        {trend !== undefined && (
          <Badge
            variant={trend > 0 ? "success" : trend < 0 ? "destructive" : "outline"}
            className="transition-all duration-300"
          >
            {trend > 0 && "+"}
            {trend}%
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {/* On passe de "text-3xl font-extrabold" à "text-xl font-normal" */}
        <div className="text-xl font-normal">{value}</div>
        <p className="text-xs text-gray-600">{description}</p>
        {explanation && <p className="text-xs italic text-gray-500 mt-1">{explanation}</p>}
        {progress !== undefined && (
          <div className="mt-2 space-y-1">
            <Progress
              value={progress}
              className="h-2 rounded"
              indicatorClassName={cn(
                "transition-all duration-500",
                progress >= 66 ? "bg-green-500" : progress >= 33 ? "bg-yellow-500" : "bg-red-500"
              )}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * ------------------------------------
 * CUSTOM TOOLTIP COMPONENT
 * ------------------------------------
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-white p-3 shadow-xl">
      {label && <div className="mb-2 font-semibold">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          let suffix = ""
          if (["efficiency", "onTimeRate"].includes(entry.dataKey)) suffix = "%"
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}
                />
                <span className="text-sm text-gray-700">{entry.name}</span>
              </div>
              <span className="font-bold">
                {entry.value}
                {suffix}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * ------------------------------------
 * MAIN COMPONENT: TASK STATISTICS
 * ------------------------------------
 */
export default function TaskStats() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Plage de temps sélectionnée : "week", "month" ou "year"
  const [timeRange, setTimeRange] = useState("month")
  // Onglet sélectionné : "overview" ou "maintenance"
  const [selectedView, setSelectedView] = useState("overview")

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTasks()
      setTasks(data)
    } catch (err) {
      console.error("Error loading tasks:", err)
      setError(err.message || "Cannot Load Tasks")
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = useMemo(() => {
    const now = new Date()
    if (timeRange === "week") {
      return tasks.filter((task) => new Date(task.createdAt) >= subDays(now, 7))
    } else if (timeRange === "month") {
      return tasks.filter((task) => new Date(task.createdAt) >= subDays(now, 30))
    }
    return tasks
  }, [tasks, timeRange])

  const metrics = useMemo(() => {
    const now = new Date()
    const completed = filteredTasks.filter((t) => t.status === "done")
    const inProgress = filteredTasks.filter((t) => t.status === "in_progress")
    const review = filteredTasks.filter((t) => t.status === "review")
    const todo = filteredTasks.filter((t) => t.status === "todo")
    const overdue = filteredTasks.filter(
      (t) => t.deadline && t.status !== "done" && isBefore(parseISO(t.deadline), now)
    )

    // Tâches de maintenance
    const maintenanceTasks = filteredTasks.filter(
      (t) => t.title && t.title.startsWith("Maintenance |")
    )
    const maintenanceCompleted = maintenanceTasks.filter((t) => t.status === "done").length
    const maintenanceOverdue = maintenanceTasks.filter(
      (t) => t.deadline && t.status !== "done" && isBefore(parseISO(t.deadline), now)
    ).length

    // Calcul par utilisateur
    const assigneePerformance = Object.values(
      filteredTasks.reduce((acc, task) => {
        if (task.assignedTo) {
          const { _id, name, email, avatar } = task.assignedTo
          if (!acc[_id]) {
            acc[_id] = {
              id: _id,
              name: name || email?.split("@")[0] || "Unknown",
              avatar: avatar || DEFAULT_AVATAR,
              totalTasks: 0,
              completedTasks: 0,
              onTime: 0,
              overdue: 0,
              inProgress: 0,
              review: 0,
              todo: 0,
              maintenanceTotal: 0,
              maintenanceCompleted: 0,
            }
          }
          acc[_id].totalTasks++

          if (task.status === "done") {
            acc[_id].completedTasks++
            if (
              task.deadline &&
              task.completedAt &&
              parseISO(task.completedAt) <= parseISO(task.deadline)
            ) {
              acc[_id].onTime++
            }
          }
          if (task.status === "in_progress") acc[_id].inProgress++
          if (task.status === "review") acc[_id].review++
          if (task.status === "todo") acc[_id].todo++

          if (
            task.deadline &&
            task.status !== "done" &&
            isBefore(parseISO(task.deadline), now)
          ) {
            acc[_id].overdue++
          }

          // Maintenance
          if (task.title && task.title.startsWith("Maintenance |")) {
            acc[_id].maintenanceTotal++
            if (task.status === "done") {
              acc[_id].maintenanceCompleted++
            }
          }
        }
        return acc
      }, {})
    ).map((user) => {
      const efficiency = user.totalTasks
        ? Math.round((user.completedTasks / user.totalTasks) * 100)
        : 0
      const onTimeRate = user.completedTasks
        ? Math.round((user.onTime / user.completedTasks) * 100)
        : 0

      return {
        ...user,
        efficiency,
        onTimeRate,
      }
    })

    assigneePerformance.sort((a, b) => b.completedTasks - a.completedTasks)

    const total = filteredTasks.length
    const completionRate = total ? Math.round((completed.length / total) * 100) : 0

    const totalMaintenance = maintenanceTasks.length
    const maintenanceCompletionRate = totalMaintenance
      ? Math.round((maintenanceCompleted / totalMaintenance) * 100)
      : 0

    return {
      total,
      completed: completed.length,
      inProgress: inProgress.length,
      review: review.length,
      todo: todo.length,
      overdue: overdue.length,
      completionRate,
      completionTrend: 0,
      assigneePerformance,
      maintenanceTasksCount: totalMaintenance,
      maintenanceCompletedCount: maintenanceCompleted,
      maintenanceOverdueCount: maintenanceOverdue,
      maintenanceCompletionRate,
    }
  }, [filteredTasks])

  const timelineData = useMemo(() => {
    const now = new Date()
    const data = []
    if (timeRange === "year") {
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i)
        const monthTasks = tasks.filter((task) => {
          const taskDate = new Date(task.createdAt)
          return (
            taskDate.getFullYear() === date.getFullYear() &&
            taskDate.getMonth() === date.getMonth()
          )
        })
        const created = monthTasks.length
        const completed = monthTasks.filter((task) => task.status === "done").length
        data.push({
          date: format(date, "MMM yyyy"),
          created,
          completed,
        })
      }
    } else {
      const days = timeRange === "week" ? 7 : 30
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(now, i)
        const dayTasks = tasks.filter((task) => {
          const taskDate = new Date(task.createdAt)
          return (
            taskDate.getDate() === date.getDate() &&
            taskDate.getMonth() === date.getMonth() &&
            taskDate.getFullYear() === date.getFullYear()
          )
        })
        data.push({
          date: format(date, "dd/MM"),
          created: dayTasks.length,
          completed: dayTasks.filter((task) => task.status === "done").length,
          todo: dayTasks.filter((task) => task.status === "todo").length,
          inProgress: dayTasks.filter((task) => task.status === "in_progress").length,
          review: dayTasks.filter((task) => task.status === "review").length,
        })
      }
    }
    return data
  }, [tasks, timeRange])

  const renderOverviewSection = () => (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={CheckCircle2}
          label="Completed Tasks"
          value={metrics.completed}
          trend={0}
          description="Number of tasks that have been finished."
          explanation="This shows how many tasks are marked as completed out of all tasks."
          color="text-blue-500"
          progress={metrics.completionRate}
        />
        <StatCard
          icon={Activity}
          label="Active Projects"
          value={metrics.inProgress + metrics.review}
          trend={0}
          description="Tasks that are currently in progress or under review."
          explanation="This is the sum of tasks being worked on and tasks pending review."
          color="text-orange-500"
          progress={metrics.total ? ((metrics.inProgress + metrics.review) / metrics.total) * 100 : 0}
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue Tasks"
          value={metrics.overdue}
          trend={0}
          description="Tasks that have exceeded their deadline."
          explanation="These tasks are past their due date and require attention."
          color="text-red-500"
          progress={metrics.total ? (metrics.overdue / metrics.total) * 100 : 0}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <StatCard
          icon={PieChart}
          label="Total Tasks"
          value={metrics.total}
          trend={0}
          description="All tasks that have been created."
          explanation="This number represents the entire pool of tasks."
          color="text-purple-500"
        />
        <StatCard
          icon={Star}
          label="Team Efficiency"
          value={`${metrics.completionRate}%`}
          trend={0}
          description="Overall completion rate of tasks."
          explanation="Calculated as the percentage of completed tasks out of the total tasks."
          color="text-yellow-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Task Progress
          </CardTitle>
          <CardDescription>
            {timeRange === "year"
              ? "Last 12 Months"
              : timeRange === "week"
              ? "Last 7 Days"
              : "Last 30 Days"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {timeRange === "year" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
                  <XAxis dataKey="date" stroke="currentColor" />
                  <YAxis stroke="currentColor" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="created" name="Created Tasks" fill={CHART_COLORS.primary.main} />
                  <Bar dataKey="completed" name="Completed Tasks" fill={CHART_COLORS.done.main} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    {Object.entries(CHART_COLORS).map(([key, color]) => (
                      <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={color.main} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
                  <XAxis dataKey="date" stroke="currentColor" />
                  <YAxis stroke="currentColor" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="todo"
                    name="To Do"
                    stroke={CHART_COLORS.todo.main}
                    fill={`url(#colortodo)`}
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="inProgress"
                    name="In Progress"
                    stroke={CHART_COLORS.inProgress.main}
                    fill={`url(#colorinProgress)`}
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="review"
                    name="Review"
                    stroke={CHART_COLORS.review.main}
                    fill={`url(#colorreview)`}
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke={CHART_COLORS.done.main}
                    fill={`url(#colordone)`}
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderMaintenanceSection = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Maintenance Statistics</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Tasks that start with "Maintenance |"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={PieChart}
                label="Maintenance Tasks"
                value={metrics.maintenanceTasksCount}
                description="Total Maintenance Tasks"
                explanation="This number represents all tasks categorized as maintenance."
                color="text-indigo-500"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={metrics.maintenanceCompletedCount}
                description="Maintenance Tasks Completed"
                explanation="Number of maintenance tasks that have been finished."
                color="text-blue-500"
              />
              <StatCard
                icon={AlertCircle}
                label="Overdue"
                value={metrics.maintenanceOverdueCount}
                description="Maintenance Tasks Overdue"
                explanation="Maintenance tasks that are past their deadline."
                color="text-red-500"
              />
              <StatCard
                icon={Star}
                label="Completion Rate"
                value={`${metrics.maintenanceCompletionRate}%`}
                description="Maintenance Completion Rate"
                explanation="Percentage of maintenance tasks completed out of total maintenance tasks."
                color="text-orange-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="text-primary"
        >
          <RefreshCw className="w-8 h-8" />
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadTasks} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task Analytics</h2>
          <p className="text-gray-600">Detailed analytics of tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadTasks}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Star className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {selectedView === "overview" && renderOverviewSection()}
            {selectedView === "maintenance" && renderMaintenanceSection()}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
