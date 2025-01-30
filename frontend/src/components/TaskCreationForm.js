import React, { useState, useEffect } from "react"
import { createTask, updateTask, getUsers, createNotification } from "../utils/api"
import { useNotifications } from "../contexts/NotificationContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTranslation } from "../hooks/useTranslation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function TaskCreationForm({ onSuccess, onCancel, mode = "create", initialData = null }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    deadline: "",
    estimatedTime: "",
    assignedTo: "",
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userError, setUserError] = useState("")
  const { showToast } = useNotifications()
  const { user } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        status: initialData.status || "todo",
        priority: initialData.priority || "medium",
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : "",
        estimatedTime: initialData.estimatedTime || "",
        assignedTo: initialData.assignedTo?._id || "",
      })
    }
  }, [initialData])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      setUserError("")
      const fetchedUsers = await getUsers()
      setUsers(fetchedUsers)
    } catch (err) {
      console.error("Error loading users:", err)
      setUserError(err.message)
      showToast(t("error"), t("errorLoadingUsers"), "destructive")
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loadingUsers) return

    try {
      setLoading(true)
      let result

      if (mode === "edit" && initialData?._id) {
        result = await updateTask(initialData._id, formData)
      } else {
        result = await createTask({
          ...formData,
          createdBy: user.id,
        })
      }

      if (formData.assignedTo) {
        const assignedUser = users.find((u) => u._id === formData.assignedTo)
        if (assignedUser) {
          try {
            await createNotification({
              userId: assignedUser._id,
              type: "TASK_ASSIGNED",
              message: t("taskAssignedNotification", {
                userName: user.name,
                taskTitle: formData.title,
              }),
              taskId: result._id,
              read: false,
            })
          } catch (error) {
            console.error("Notification creation error:", error)
          }
        }
      }

      showToast(t("success"), mode === "edit" ? t("taskModified") : t("taskCreated"))

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      console.error("Error handling task:", err)
      showToast(
        t("error"),
        err.message || (mode === "edit" ? t("cannotModifyTask") : t("cannotCreateTask")),
        "destructive",
      )
    } finally {
      setLoading(false)
    }
  }

  const getUserDisplayName = (user) => {
    return user.username || user.name || user.email
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground">
          {t("title")}
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="bg-background border-input text-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">
          {t("description")}
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="min-h-[100px] bg-background border-input text-foreground resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">{t("priority")}</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger className="bg-background border-input text-foreground">
              <SelectValue placeholder={t("selectPriority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t("low")}</SelectItem>
              <SelectItem value="medium">{t("medium")}</SelectItem>
              <SelectItem value="high">{t("high")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">{t("status")}</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger className="bg-background border-input text-foreground">
              <SelectValue placeholder={t("selectStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">{t("todo")}</SelectItem>
              <SelectItem value="in_progress">{t("in_progress")}</SelectItem>
              <SelectItem value="review">{t("review")}</SelectItem>
              <SelectItem value="done">{t("done")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">{t("deadline")}</Label>
          <Input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="bg-background border-input text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedTime" className="text-foreground">
            {t("estimatedTime")}
          </Label>
          <Input
            id="estimatedTime"
            type="number"
            min="0"
            step="0.5"
            value={formData.estimatedTime}
            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
            className="bg-background border-input text-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">{t("assignedTo")}</Label>
        <div className="relative">
          <Select
            value={formData.assignedTo}
            onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
            disabled={loadingUsers}
          >
            <SelectTrigger className="w-full bg-background border-input text-foreground">
              <SelectValue placeholder={t("selectAssignee")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">{t("unassigned")}</SelectItem>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {getUserDisplayName(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingUsers && (
            <div className="absolute right-3 top-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {userError && (
          <p className="text-sm text-destructive mt-1">
            {userError}
            <button type="button" onClick={loadUsers} className="ml-2 underline hover:no-underline">
              {t("retry")}
            </button>
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="bg-background border-input text-foreground hover:bg-accent"
          >
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={loading || loadingUsers} className="bg-primary text-primary-foreground">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "edit" ? t("modifying") : t("creating")}
            </>
          ) : mode === "edit" ? (
            t("editTask")
          ) : (
            t("createTask")
          )}
        </Button>
      </div>
    </form>
  )
}

