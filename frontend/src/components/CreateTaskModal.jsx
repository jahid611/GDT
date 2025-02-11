"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslation } from "../hooks/useTranslation"
import { useToast } from "../hooks/useToast"
import { createTask } from "../utils/api"
import { Loader2, User } from "lucide-react"

const DEFAULT_AVATAR =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-L1LHIDu8Qzc1p3IctdN9zpykntVGxf.png"

export default function CreateTaskModal({ open, onClose, onSuccess, team = {}, currentUser }) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [deadline, setDeadline] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Add null check for team name
  const teamPrefix = team?.name ? `${team.name} | ` : ""

  useEffect(() => {
    if (open) {
      setTitle("")
      setDescription("")
      setStatus("todo")
      setPriority("medium")
      setDeadline("")
      setEstimatedTime("")
      setAssignedTo("")
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast({
        title: t("error"),
        description: t("taskTitleRequired"),
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const taskData = {
        title: `${teamPrefix}${title.trim()}`,
        description: description.trim(),
        status,
        priority,
        deadline: deadline || null,
        estimatedTime: estimatedTime || null,
        assignedTo: assignedTo === "unassigned" ? team.name : assignedTo,
        createdBy: currentUser._id,
        teamId: team._id,
      }

      const createdTask = await createTask(taskData)
      onSuccess(createdTask)
      toast({
        title: t("success"),
        description: t("taskCreated"),
      })
      onClose()
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: t("error"),
        description: error.message || t("cannotCreateTask"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("createTask")}</DialogTitle>
          <DialogDescription>{t("createTaskDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("title")}</Label>
              <div className="flex gap-2">
                <Input
                  value={teamPrefix}
                  readOnly
                  className="w-auto bg-gray-100 dark:bg-gray-700 border-input text-foreground cursor-not-allowed"
                />
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("enterTaskTitle")}
                  required
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("enterTaskDescription")}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("priority")}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
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
                <Label>{t("status")}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{t("todo")}</SelectItem>
                    <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                    <SelectItem value="review">{t("review")}</SelectItem>
                    <SelectItem value="done">{t("done")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("deadline")}</Label>
                <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedTime">{t("estimatedTime")}</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("assignTo")}</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectAssignee")} />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    <SelectItem value="unassigned">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span>{team.name}</span>
                      </div>
                    </SelectItem>
                    {team.members?.map((member) => (
                      <SelectItem key={member.id || member._id} value={member.id || member._id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar || DEFAULT_AVATAR} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{member.name || member.username || member.email}</span>
                            {member.name && <span className="text-xs text-muted-foreground">{member.email}</span>}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("createTask")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

