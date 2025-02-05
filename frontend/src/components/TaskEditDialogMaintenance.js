"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TaskCreationFormMaintenance from "./TaskCreationFormMaintenance"
import { useTranslation } from "../hooks/useTranslation"

export default function TaskEditDialogMaintenance({ task, open, onOpenChange, onTaskUpdated }) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editTask")}</DialogTitle>
        </DialogHeader>
        <TaskCreationFormMaintenance
          mode="edit"
          initialData={{
            ...task,
            deadline: task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
            assignedTo: task?.assignedTo?._id || "",
          }}
          onSuccess={(updatedTask) => {
            onTaskUpdated(updatedTask)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
