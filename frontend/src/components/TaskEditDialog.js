import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TaskCreationForm from "./TaskCreationForm"
import { useTranslation } from "../hooks/useTranslation"

const TaskEditDialog = ({ task, open, onOpenChange, onTaskUpdated }) => {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("editTask")}</DialogTitle>
        </DialogHeader>
        <TaskCreationForm
          mode="edit"
          initialData={task}
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

export default TaskEditDialog

