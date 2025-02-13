"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchTasks } from "../utils/api"
import { format, isBefore, differenceInDays, parseISO } from "date-fns"
import {
  Clock,
  Activity,
  Calendar,
  RefreshCw,
  PieChart,
  Trophy,
  Star,
  CheckCircle2,
  Users,
  Timer,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "../hooks/useTranslation"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

// Couleurs du thème avec dégradés
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

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=??&backgroundColor=52,53,65,255"

function StatCard({ icon: Icon, label, value, trend, description, color, progress }) {
  return (
    <Card className="relative overflow-hidden transition-transform transform rounded-lg hover:shadow-xl hover:scale-105 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
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
        <div className="space-y-2">
          <div className="text-3xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {progress !== undefined && (
            <div className="space-y-1">
              <Progress
                value={progress}
                className="h-2 rounded"
                indicatorClassName={cn(
                  "transition-all duration-500",
                  progress >= 66 ? "bg-success" : progress >= 33 ? "bg-warning" : "bg-destructive",
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg animate-in fade-in-50 zoom-in-95">
      {label && <div className="mb-2 font-medium">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}
              />
              <span className="text-sm text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium tabular-nums">
              {entry.value}
              {entry.unit && entry.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TaskStats() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("month")
  const [selectedView, setSelectedView] = useState("overview")
  const { t } = useTranslation()

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
      setError(err.message || t("cannotLoadTasks"))
    } finally {
      setLoading(false)
    }
  }

  const metrics = useMemo(() => {
    const now = new Date()
    const completed = tasks.filter((t) => t.status === "done")
    const inProgress = tasks.filter((t) => t.status === "in_progress")
    const review = tasks.filter((t) => t.status === "review")
    const todo = tasks.filter((t) => t.status === "todo")
    const overdue = tasks.filter((t) => t.deadline && t.status !== "done" && isBefore(parseISO(t.deadline), now))

    // Temps de complétion
    const completionTimes = completed
      .filter((t) => t.completedAt && t.createdAt)
      .map((t) => differenceInDays(new Date(t.completedAt), new Date(t.createdAt)))

    const averageCompletionTime =
      completionTimes.length > 0
        ? Math.round(completionTimes.reduce((acc, curr) => acc + curr, 0) / completionTimes.length)
        : 0

    // Répartition des priorités
    const priorityDistribution = {
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    }

    // Performance par assigné
    const assigneePerformance = Object.values(
      tasks.reduce((acc, task) => {
        if (task.assignedTo) {
          const { _id, name, email, avatar } = task.assignedTo
          if (!acc[_id]) {
            acc[_id] = {
              id: _id,
              name: name || email?.split("@")[0] || "Unknown",
              avatar: avatar || DEFAULT_AVATAR,
              completed: 0,
              inProgress: 0,
              review: 0,
              todo: 0,
              total: 0,
              efficiency: 0,
              onTime: 0,
              overdue: 0,
              avgCompletionTime: 0,
              completedTasks: [],
            }
          }
          acc[_id].total++

          if (task.status === "done") {
            acc[_id].completed++
            acc[_id].completedTasks.push(task)
            if (task.deadline && new Date(task.completedAt) <= new Date(task.deadline)) {
              acc[_id].onTime++
            }
          }
          if (task.status === "in_progress") acc[_id].inProgress++
          if (task.status === "review") acc[_id].review++
          if (task.status === "todo") acc[_id].todo++
          if (task.deadline && task.status !== "done" && isBefore(new Date(task.deadline), now)) {
            acc[_id].overdue++
          }
        }
        return acc
      }, {}),
    )
      .map((assignee) => {
        // Temps moyen de complétion par assigné
        const completionTimes = assignee.completedTasks
          .filter((t) => t.completedAt && t.createdAt)
          .map((t) => differenceInDays(new Date(t.completedAt), new Date(t.createdAt)))

        const avgCompletionTime =
          completionTimes.length > 0
            ? Math.round(completionTimes.reduce((acc, curr) => acc + curr, 0) / completionTimes.length)
            : 0

        return {
          ...assignee,
          efficiency: Math.round((assignee.completed / assignee.total) * 100) || 0,
          onTimeRate: Math.round((assignee.onTime / assignee.completed) * 100) || 0,
          overdueRate: Math.round((assignee.overdue / assignee.total) * 100) || 0,
          avgCompletionTime,
        }
      })
      .sort((a, b) => b.completed - a.completed)

    // Tendance de complétion
    const previousCompleted = completed.filter(
      (t) => t.completedAt && differenceInDays(now, new Date(t.completedAt)) <= 14,
    ).length
    const currentCompleted = completed.filter(
      (t) => t.completedAt && differenceInDays(now, new Date(t.completedAt)) <= 7,
    ).length
    const completionTrend = previousCompleted
      ? Math.round(((currentCompleted - previousCompleted) / previousCompleted) * 100)
      : 0

    return {
      total: tasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      review: review.length,
      todo: todo.length,
      overdue: overdue.length,
      completionRate: Math.round((completed.length / (tasks.length || 1)) * 100),
      averageCompletionTime,
      completionTrend,
      priorityDistribution,
      assigneePerformance,
    }
  }, [tasks])

  const timelineData = useMemo(() => {
    const now = new Date()
    const data = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      const dayTasks = tasks.filter((task) => {
        const taskDate = new Date(task.createdAt)
        return (
          taskDate.getDate() === date.getDate() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getFullYear() === date.getFullYear()
        )
      })

      const completed = dayTasks.filter((task) => task.status === "done").length
      const created = dayTasks.length
      const todo = dayTasks.filter((task) => task.status === "todo").length
      const inProgress = dayTasks.filter((task) => task.status === "in_progress").length
      const review = dayTasks.filter((task) => task.status === "review").length

      data.push({
        date: format(date, "dd/MM"),
        completed,
        created,
        todo,
        inProgress,
        review,
        trend:
          i > 0
            ? ((completed - data[data.length - 1]?.completed) / (data[data.length - 1]?.completed || 1)) * 100
            : 0,
      })
    }

    return data
  }, [tasks])

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* Statistiques clés */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label={t("completedTasks")}
          value={metrics.completed}
          trend={metrics.completionTrend}
          description={t("tasksCompleted")}
          color="text-emerald-500"
          progress={metrics.completionRate}
        />
        <StatCard
          icon={Activity}
          label={t("activeProjects")}
          value={metrics.inProgress + metrics.review}
          trend={0}
          description={t("tasksInProgress")}
          color="text-blue-500"
          progress={((metrics.inProgress + metrics.review) / metrics.total) * 100}
        />
        <StatCard
          icon={AlertCircle}
          label={t("overdueTasks")}
          value={metrics.overdue}
          trend={-Math.round((metrics.overdue / metrics.total) * 100)}
          description={t("needsAttention")}
          color="text-red-500"
          progress={(metrics.overdue / metrics.total) * 100}
        />
        <StatCard
          icon={Clock}
          label={t("avgCompletionTime")}
          value={`${metrics.averageCompletionTime} ${t("days")}`}
          description={t("timeToComplete")}
          color="text-amber-500"
          progress={Math.min((metrics.averageCompletionTime / 14) * 100, 100)}
        />
      </div>

      {/* Timeline d'activité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {t("taskProgress")}
          </CardTitle>
          <CardDescription>{t("last7Days")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="todo"
                  name={t("todo")}
                  stroke={CHART_COLORS.todo.main}
                  fill={`url(#colortodo)`}
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="inProgress"
                  name={t("inProgress")}
                  stroke={CHART_COLORS.inProgress.main}
                  fill={`url(#colorinProgress)`}
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="review"
                  name={t("review")}
                  stroke={CHART_COLORS.review.main}
                  fill={`url(#colorreview)`}
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name={t("completed")}
                  stroke={CHART_COLORS.done.main}
                  fill={`url(#colordone)`}
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Répartition des tâches et performance de l'équipe */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              {t("taskDistribution")}
            </CardTitle>
            <CardDescription>{t("tasksByStatus")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsePie>
                  <Pie
                    data={[
                      { name: t("todo"), value: metrics.todo },
                      { name: t("inProgress"), value: metrics.inProgress },
                      { name: t("review"), value: metrics.review },
                      { name: t("completed"), value: metrics.completed },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { color: CHART_COLORS.todo.main },
                      { color: CHART_COLORS.inProgress.main },
                      { color: CHART_COLORS.review.main },
                      { color: CHART_COLORS.done.main },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RechartsePie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {t("topPerformers")}
            </CardTitle>
            <CardDescription>{t("mostProductiveMembers")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.assigneePerformance.slice(0, 5).map((assignee, index) => (
                <div key={assignee.id} className="flex items-center gap-4 p-2 rounded hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                      <AvatarImage src={assignee.avatar} alt={assignee.name} />
                      <AvatarFallback>{assignee.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{assignee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignee.completed} {t("tasksCompleted")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-medium">{assignee.efficiency}%</p>
                      <p className="text-xs text-muted-foreground">{t("efficiency")}</p>
                    </div>
                    {index === 0 && <Star className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderTeamSection = () => (
    <div className="space-y-6">
      {/* Performance de l'équipe */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t("teamPerformance")}
            </CardTitle>
            <CardDescription>{t("memberStats")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {metrics.assigneePerformance.map((member) => (
                <div key={member.id} className="space-y-2 p-3 rounded hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{member.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                          >
                            {member.completed} {t("completed")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                          >
                            {member.inProgress} {t("active")}
                          </Badge>
                          {member.overdue > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                            >
                              {member.overdue} {t("overdue")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t("efficiency")}</p>
                          <p className="font-medium">{member.efficiency}%</p>
                          <Progress
                            value={member.efficiency}
                            className="h-1 mt-1 rounded"
                            indicatorClassName={cn(
                              "transition-all duration-500",
                              member.efficiency >= 75
                                ? "bg-emerald-500"
                                : member.efficiency >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500",
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("onTime")}</p>
                          <p className="font-medium">{member.onTimeRate}%</p>
                          <Progress
                            value={member.onTimeRate}
                            className="h-1 mt-1 rounded"
                            indicatorClassName={cn(
                              "transition-all duration-500",
                              member.onTimeRate >= 75
                                ? "bg-emerald-500"
                                : member.onTimeRate >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500",
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("avgTime")}</p>
                          <p className="font-medium">
                            {member.avgCompletionTime} {t("days")}
                          </p>
                          <Progress
                            value={Math.max(0, 100 - (member.avgCompletionTime / 14) * 100)}
                            className="h-1 mt-1 rounded"
                            indicatorClassName={cn(
                              "transition-all duration-500",
                              member.avgCompletionTime <= 7
                                ? "bg-emerald-500"
                                : member.avgCompletionTime <= 14
                                  ? "bg-amber-500"
                                  : "bg-red-500",
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              {t("completionTimes")}
            </CardTitle>
            <CardDescription>{t("avgTimePerMember")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.assigneePerformance}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" stroke="currentColor" />
                  <YAxis dataKey="name" type="category" stroke="currentColor" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="avgCompletionTime" name={t("avgDays")} fill={CHART_COLORS.primary.main}>
                    {metrics.assigneePerformance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.avgCompletionTime <= 7
                            ? CHART_COLORS.done.main
                            : entry.avgCompletionTime <= 14
                              ? CHART_COLORS.review.main
                              : CHART_COLORS.todo.main
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("completionRates")}
            </CardTitle>
            <CardDescription>{t("successRateByMember")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={metrics.assigneePerformance}>
                  <PolarGrid stroke={CHART_COLORS.muted} />
                  <PolarAngleAxis dataKey="name" stroke="currentColor" />
                  <PolarRadiusAxis stroke="currentColor" />
                  <Radar
                    name={t("efficiency")}
                    dataKey="efficiency"
                    stroke={CHART_COLORS.primary.main}
                    fill={CHART_COLORS.primary.main}
                    fillOpacity={0.6}
                  />
                  <Radar
                    name={t("onTimeRate")}
                    dataKey="onTimeRate"
                    stroke={CHART_COLORS.done.main}
                    fill={CHART_COLORS.done.main}
                    fillOpacity={0.6}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

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
          <CardTitle className="text-destructive">{t("error")}</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadTasks} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("taskAnalytics")}</h2>
          <p className="text-muted-foreground">{t("analyticsDescription")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("selectTimeRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t("lastWeek")}</SelectItem>
              <SelectItem value="month">{t("lastMonth")}</SelectItem>
              <SelectItem value="year">{t("lastYear")}</SelectItem>
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
            {t("overview")}
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            {t("team")}
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
            {selectedView === "overview" ? renderOverviewSection() : renderTeamSection()}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
