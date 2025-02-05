"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchTasks } from "../utils/api"
import { format, isBefore, startOfMonth, endOfMonth, differenceInDays } from "date-fns"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Calendar,
  TrendingUp,
  Users,
  Timer,
  BarChart2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "../hooks/useTranslation"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function TaskStats() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("month")
  const [selectedMetric, setSelectedMetric] = useState("completion")
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
    const overdue = tasks.filter((t) => t.deadline && t.status !== "done" && isBefore(new Date(t.deadline), now))

    const completionTimes = completed
      .filter((t) => t.completedAt && t.createdAt)
      .map((t) => differenceInDays(new Date(t.completedAt), new Date(t.createdAt)))

    const averageCompletionTime =
      completionTimes.length > 0
        ? Math.round(completionTimes.reduce((acc, curr) => acc + curr, 0) / completionTimes.length)
        : 0

    const priorityDistribution = {
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    }

    const startDate = startOfMonth(now)
    const endDate = endOfMonth(now)
    const timelineData = {
      labels: [],
      completed: [],
      created: [],
    }

    const assigneePerformance = Object.values(
      tasks.reduce((acc, task) => {
        if (task.assignedTo) {
          const { _id, name } = task.assignedTo
          if (!acc[_id]) {
            acc[_id] = {
              name,
              completed: 0,
              inProgress: 0,
              efficiency: 0,
            }
          }
          if (task.status === "done") acc[_id].completed++
          if (task.status === "in_progress") acc[_id].inProgress++
        }
        return acc
      }, {}),
    ).map((assignee) => ({
      ...assignee,
      efficiency: Math.round((assignee.completed / (assignee.completed + assignee.inProgress)) * 100) || 0,
    }))

    return {
      total: tasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      review: review.length,
      todo: todo.length,
      overdue: overdue.length,
      completionRate: Math.round((completed.length / tasks.length) * 100) || 0,
      averageCompletionTime,
      priorityDistribution,
      timelineData,
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

      data.push({
        date: format(date, "dd/MM"),
        completed,
        created,
        active: created - completed,
      })
    }

    return data
  }, [tasks])

  const renderCompletionMetrics = () => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {t("completedTasks")}
          </CardTitle>
          <Badge variant="success">{metrics.completionRate}%</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{metrics.completed}</div>
          <Progress value={metrics.completionRate} className="h-2 bg-green-200" />
          <p className="text-xs text-muted-foreground mt-2">{t("completedTasksDesc")}</p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4 text-blue-500" />
            {t("tasksInProgress")}
          </CardTitle>
          <Badge variant="secondary">{Math.round((metrics.inProgress / metrics.total) * 100)}%</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{metrics.inProgress}</div>
          <Progress value={(metrics.inProgress / metrics.total) * 100} className="h-2 bg-blue-200" />
          <p className="text-xs text-muted-foreground mt-2">{t("tasksInProgressDesc")}</p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 text-red-500" />
            {t("overdueTasks")}
          </CardTitle>
          <Badge variant="destructive">{Math.round((metrics.overdue / metrics.total) * 100)}%</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{metrics.overdue}</div>
          <Progress value={(metrics.overdue / metrics.total) * 100} className="h-2 bg-red-200" />
          <p className="text-xs text-muted-foreground mt-2">{t("overdueTasksDesc")}</p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-orange-500" />
            {t("averageTime")}
          </CardTitle>
          <Badge variant="outline">
            {metrics.averageCompletionTime} {t("days")}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{metrics.averageCompletionTime}</div>
          <Progress value={Math.min(100, (metrics.averageCompletionTime / 14) * 100)} className="h-2 bg-orange-200" />
          <p className="text-xs text-muted-foreground mt-2">{t("averageCompletionTimeDesc")}</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderPriorityMetrics = () => (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t("priorityDistribution")}
          </CardTitle>
          <CardDescription>{t("tasksByPriority")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge variant="destructive">{t("high")}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.priorityDistribution.high} {t("tasks")}
                  </span>
                </span>
                <span className="text-sm font-medium">
                  {Math.round((metrics.priorityDistribution.high / metrics.total) * 100)}%
                </span>
              </div>
              <Progress value={(metrics.priorityDistribution.high / metrics.total) * 100} className="h-2 bg-red-200" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge variant="warning">{t("medium")}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.priorityDistribution.medium} {t("tasks")}
                  </span>
                </span>
                <span className="text-sm font-medium">
                  {Math.round((metrics.priorityDistribution.medium / metrics.total) * 100)}%
                </span>
              </div>
              <Progress
                value={(metrics.priorityDistribution.medium / metrics.total) * 100}
                className="h-2 bg-yellow-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge variant="success">{t("low")}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.priorityDistribution.low} {t("tasks")}
                  </span>
                </span>
                <span className="text-sm font-medium">
                  {Math.round((metrics.priorityDistribution.low / metrics.total) * 100)}%
                </span>
              </div>
              <Progress value={(metrics.priorityDistribution.low / metrics.total) * 100} className="h-2 bg-green-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            {t("statusBreakdown")}
          </CardTitle>
          <CardDescription>{t("currentStatus")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{t("todo")}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.todo} {t("tasks")}
                  </span>
                </span>
                <span className="text-sm font-medium">{Math.round((metrics.todo / metrics.total) * 100)}%</span>
              </div>
              <Progress value={(metrics.todo / metrics.total) * 100} className="h-2 bg-gray-200" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge variant="secondary">{t("inProgress")}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.inProgress} {t("tasks")}
                  </span>
                </span>
                <span className="text-sm font-medium">{Math.round((metrics.inProgress / metrics.total) * 100)}%</span>
              </div>
              <Progress value={(metrics.inProgress / metrics.total) * 100} className="h-2 bg-blue-200" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge variant="warning">{t("review")}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.review} {t("tasks")}
                  </span>
                </span>
                <span className="text-sm font-medium">{Math.round((metrics.review / metrics.total) * 100)}%</span>
              </div>
              <Progress value={(metrics.review / metrics.total) * 100} className="h-2 bg-yellow-200" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge variant="success">{t("done")}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.completed} {t("tasks")}
                  </span>
                </span>
                <span className="text-sm font-medium">{Math.round((metrics.completed / metrics.total) * 100)}%</span>
              </div>
              <Progress value={(metrics.completed / metrics.total) * 100} className="h-2 bg-green-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTimelineMetrics = () => {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              {t("taskTimeline")}
            </CardTitle>
            <CardDescription>{t("last7Days")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" stroke="currentColor" className="text-xs" />
                  <YAxis stroke="currentColor" className="text-xs" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
                                <span className="font-bold text-muted-foreground">
                                  {t("created")}: {payload[0].value}
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {t("completed")}: {payload[1].value}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ strokeWidth: 2 }}
                    name={t("created")}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ strokeWidth: 2 }}
                    name={t("completed")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {t("weeklyProgress")}
            </CardTitle>
            <CardDescription>{t("weeklyProgressDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("tasksCreated")}</p>
                  <p className="text-2xl font-bold">{timelineData.reduce((acc, day) => acc + day.created, 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t("tasksCompleted")}</p>
                  <p className="text-2xl font-bold">{timelineData.reduce((acc, day) => acc + day.completed, 0)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("completionRate")}</p>
                <Progress
                  value={
                    (timelineData.reduce((acc, day) => acc + day.completed, 0) /
                      timelineData.reduce((acc, day) => acc + day.created, 0)) *
                    100
                  }
                  className="h-2 bg-green-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("productivity")}
            </CardTitle>
            <CardDescription>{t("productivityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("averageTasksPerDay")}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-lg">
                    {(timelineData.reduce((acc, day) => acc + day.created, 0) / 7).toFixed(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{t("created")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-lg">
                    {(timelineData.reduce((acc, day) => acc + day.completed, 0) / 7).toFixed(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{t("completed")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPerformanceMetrics = () => {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {metrics.assigneePerformance.map((assignee) => (
          <StatsCard
            key={assignee._id}
            title={assignee.name}
            value={`${assignee.efficiency}%`}
            description={t("efficiency")}
            icon={Users}
            color="text-blue-500"
            trend={0}
          />
        ))}
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
      <Card className="border-destructive">
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
    <div className="space-y-6">
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

      <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value)}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="completion">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t("completion")}
          </TabsTrigger>
          <TabsTrigger value="priority">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t("priority")}
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="w-4 h-4 mr-2" />
            {t("timeline")}
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Users className="w-4 h-4 mr-2" />
            {t("team")}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMetric}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            <TabsContent value="completion" className="m-0">
              {renderCompletionMetrics()}
            </TabsContent>
            <TabsContent value="priority" className="m-0">
              {renderPriorityMetrics()}
            </TabsContent>
            <TabsContent value="timeline" className="m-0">
              {renderTimelineMetrics()}
            </TabsContent>
            <TabsContent value="performance" className="m-0">
              {renderPerformanceMetrics()}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}

function StatsCard({ title, value, description, icon: Icon, color, trend }) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend !== 0 && (
          <div className={`text-xs mt-2 ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
            {trend > 0 ? "+" : ""}
            {trend}% {t("fromLastPeriod")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PriorityBar({ label, value, color }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value} {t("tasks")}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  )
}

function StatusBar({ label, value, total, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value} ({Math.round((value / total) * 100)}%)
        </span>
      </div>
      <Progress value={(value / total) * 100} className={`h-2 ${color}`} />
    </div>
  )
}

