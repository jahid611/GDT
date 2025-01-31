import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, X } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"

export function TaskNotification({ userId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const { t, language } = useTranslation()

  // Fetch notifications on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications/${userId}`)
        if (!response.ok) throw new Error("Failed to fetch notifications")
        const data = await response.json()
        setNotifications(data.notifications)

        if (data.notifications.length > 0) {
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchNotifications()
  }, [userId])

  const handleDismiss = async () => {
    try {
      await fetch(`/api/notifications/${userId}/dismiss`, {
        method: "POST",
      })
      setIsOpen(false)
    } catch (error) {
      console.error("Error dismissing notifications:", error)
    }
  }

  const formatDate = (date) => {
    return format(new Date(date), "Pp", {
      locale: language === "fr" ? fr : enUS,
    })
  }

  if (notifications.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t("newTasksAssigned")}
          </DialogTitle>
          <DialogDescription>{t("youHaveNewTasks", { count: notifications.length })}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] mt-4">
          <div className="space-y-4">
            {notifications.map((task) => (
              <div key={task._id} className="p-4 rounded-lg border bg-card text-card-foreground">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    {task.deadline && (
                      <p>
                        {t("deadline")}: {formatDate(task.deadline)}
                      </p>
                    )}
                    <p>
                      {t("assignedBy")}: {task.createdBy?.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            {t("viewLater")}
          </Button>
          <Button onClick={handleDismiss}>
            <Check className="h-4 w-4 mr-2" />
            {t("markAsRead")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

