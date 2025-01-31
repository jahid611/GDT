import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "../hooks/useTranslation"
import { updateTask } from "../utils/api"
// ... (other imports)

const TaskEditDialog = ({ task, open, onOpenChange, onTaskUpdated }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    deadline: "",
    assignedTo: {
      email: "",
      name: "",
    },
  })
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        deadline: task.deadline ? new Date(task.deadline).toISOString().split("T")[0] : "",
        assignedTo: task.assignedTo || { email: "", name: "" },
      })
    }
  }, [task])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updatedTask = await updateTask(task._id, formData)
      onTaskUpdated(updatedTask)
    } catch (error) {
      console.error("Failed to update task:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTask")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... (other form fields remain the same) */}

          <div className="space-y-2">
            <Label htmlFor="assignedToEmail">{t("assignTo")}</Label>
            <Input
              id="assignedToEmail"
              type="email"
              value={formData.assignedTo?.email || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  assignedTo: {
                    ...prev.assignedTo,
                    email: e.target.value,
                    name: e.target.value.split("@")[0], // Default name to email username
                  },
                }))
              }
              placeholder="email@example.com"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TaskEditDialog

