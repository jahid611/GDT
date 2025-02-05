import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TaskCreationForm from "./TaskCreationForm"
import TaskCreationFormMaintenance from "./TaskCreationFormMaintenance"

import { useTranslation } from "../hooks/useTranslation"

export default function TaskCreationDialog({ open, onOpenChange, onSuccess, onTaskCreated }) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("newTask")}</DialogTitle>
        </DialogHeader>
        <TaskCreationForm
          onSuccess={(task) => {
            if (onSuccess) onSuccess()
            if (onTaskCreated) onTaskCreated(task)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

