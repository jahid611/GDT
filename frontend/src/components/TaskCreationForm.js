import React, { useState, useEffect } from "react"
import { createTask, updateTask, getUsers, createNotification } from "../utils/api"
import { useNotifications } from "../contexts/NotificationContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTranslation } from "../hooks/useTranslation"

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
        <Label htmlFor="title">{t("title")}</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("priority")}</Label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="low">{t("low")}</option>
            <option value="medium">{t("medium")}</option>
            <option value="high">{t("high")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>{t("status")}</Label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="todo">{t("todo")}</option>
            <option value="in_progress">{t("in_progress")}</option>
            <option value="review">{t("review")}</option>
            <option value="done">{t("done")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("deadline")}</Label>
          <Input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedTime">{t("estimatedTime")}</Label>
          <Input
            id="estimatedTime"
            type="number"
            min="0"
            step="0.5"
            value={formData.estimatedTime}
            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("assignedTo")}</Label>
        <div className="relative">
          <select
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loadingUsers}
          >
            <option value="">{t("unassigned")}</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {getUserDisplayName(user)}
              </option>
            ))}
          </select>
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
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={loading || loadingUsers}>
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

