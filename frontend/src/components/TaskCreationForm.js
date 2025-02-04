"use client"

import { useState, useEffect } from "react"
import imageCompression from "browser-image-compression"
import pako from "pako"
import { createTask, updateTask, getUsers } from "../utils/api"
import { useNotifications } from "../contexts/NotificationContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTranslation } from "../hooks/useTranslation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import emailjs from "emailjs-com"

const EMAILJS_SERVICE_ID = "service_jhd"
const EMAILJS_TEMPLATE_ID = "template_jhd"
const EMAILJS_USER_ID = "FiWAOQdkaG34q5-hc"

const DEFAULT_AVATAR =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-L1LHIDu8Qzc1p3IctdN9zpykntVGxf.png"

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

  const [attachments, setAttachments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userError, setUserError] = useState("")
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const { showToast } = useNotifications()
  const { user } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    const storedAttachments = localStorage.getItem("attachments")
    if (storedAttachments) {
      setAttachments(JSON.parse(storedAttachments))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("attachments", JSON.stringify(attachments))
  }, [attachments])

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
      console.error("Erreur lors du chargement des utilisateurs :", err)
      setUserError(err.message)
      showToast(t("error"), t("errorLoadingUsers"), "destructive")
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleFilesUpload = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newAttachments = []
      for (let i = 0; i < files.length; i++) {
        let file = files[i]

        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
          showToast(t("error"), "Type de fichier non accepté", "destructive")
          continue
        }

        if (file.type.startsWith("image/") && file.size > 102400) {
          try {
            const options = {
              maxSizeMB: 0.1,
              maxWidthOrHeight: 800,
              useWebWorker: true,
            }
            file = await imageCompression(file, options)
          } catch (err) {
            console.error("Erreur de compression de l'image :", err)
          }
        }

        if (file.type === "application/pdf" && file.size > 102400) {
          try {
            const arrayBuffer = await file.arrayBuffer()
            const compressedBuffer = pako.deflate(new Uint8Array(arrayBuffer), { level: 9 })
            file = new File([compressedBuffer], file.name, { type: file.type })
            if (file.size > 102400) {
              showToast(t("error"), "La taille compressée du PDF dépasse toujours 100KB", "destructive")
              continue
            }
          } catch (err) {
            console.error("Erreur de compression du PDF :", err)
            continue
          }
        }

        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (event) => resolve(event.target.result)
          reader.onerror = (error) => reject(error)
          reader.readAsDataURL(file)
        })
        newAttachments.push({ file, dataUrl })
      }
      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  const handleViewFile = (file) => {
    setSelectedFile(file)
    setViewerOpen(true)
  }

  const renderAttachmentPreview = (att, index) => {
    if (!att || !att.file || !att.dataUrl) return null

    const previewClasses =
      "relative group aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all duration-200"
    const buttonClasses =
      "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"

    if (att.file.type.startsWith("image/")) {
      return (
        <div key={index} className={previewClasses} onClick={() => handleViewFile(att)}>
          <img src={att.dataUrl || "/placeholder.svg"} alt={`Aperçu ${index}`} className="w-full h-full object-cover" />
          <button className={buttonClasses}>
            <span className="text-white text-sm">Voir l'image</span>
          </button>
        </div>
      )
    } else if (att.file.type === "application/pdf") {
      return (
        <div key={index} className={previewClasses} onClick={() => handleViewFile(att)}>
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center p-4">
            <svg className="w-8 h-8 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs text-center text-muted-foreground font-medium truncate max-w-full px-2">
              {att.file.name}
            </span>
          </div>
          <button className={buttonClasses}>
            <span className="text-white text-sm">Voir le PDF</span>
          </button>
        </div>
      )
    }
    return null
  }

  const sendEmailNotification = async (task) => {
    try {
      const assignedUser = users.find((u) => u._id === task.assignedTo)
      const recipientEmail = assignedUser ? assignedUser.email : user.email

      const templateParams = {
        to_email: recipientEmail,
        task_title: task.title,
        task_description: task.description,
        task_priority: task.priority,
        task_status: task.status,
        task_deadline: task.deadline ? new Date(task.deadline).toLocaleString() : "Non définie",
        attachments_count: attachments.length,
      }

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_USER_ID)
      console.log("E-mail envoyé avec succès via EmailJS")
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'e-mail avec EmailJS :", err)
    }
  }

  const storeTaskLocally = (task) => {
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || []
    storedTasks.push(task)
    localStorage.setItem("tasks", JSON.stringify(storedTasks))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loadingUsers) return

    try {
      setLoading(true)
      const formDataToSend = new FormData()

      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key])
        }
      })

      if (attachments.length > 0) {
        formDataToSend.append("imageUrl", attachments[0].dataUrl)
      }

      attachments.forEach((att) => {
        formDataToSend.append("attachments", att.file)
      })

      formDataToSend.append("createdBy", user.id)

      let result
      if (mode === "edit" && initialData?._id) {
        result = await updateTask(initialData._id, formDataToSend)
      } else {
        result = await createTask(formDataToSend)
      }

      showToast(t("success"), mode === "edit" ? t("taskModified") : t("taskCreated"))

      await sendEmailNotification(result)

      storeTaskLocally(result)

      if (onSuccess) onSuccess(result)
    } catch (err) {
      console.error("Erreur lors de la gestion de la tâche :", err)
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
    if (!user) return ""
    return user.name || user.username || user.email.split("@")[0]
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground">
            {t("title")}
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prevState) => ({ ...prevState, title: e.target.value }))}
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
            onChange={(e) => setFormData((prevState) => ({ ...prevState, description: e.target.value }))}
            required
            className="min-h-[100px] bg-background border-input text-foreground resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">{t("priority")}</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData((prevState) => ({ ...prevState, priority: value }))}
            >
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
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prevState) => ({ ...prevState, status: value }))}
            >
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">{t("deadline")}</Label>
            <Input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData((prevState) => ({ ...prevState, deadline: e.target.value }))}
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
              onChange={(e) => setFormData((prevState) => ({ ...prevState, estimatedTime: e.target.value }))}
              className="bg-background border-input text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">{t("assignedTo")}</Label>
          <div className="relative">
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => setFormData((prevState) => ({ ...prevState, assignedTo: value }))}
              disabled={loadingUsers}
            >
              <SelectTrigger className="w-full bg-background border-input text-foreground">
                <SelectValue>
                  {formData.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={users.find((u) => u._id === formData.assignedTo)?.avatar || DEFAULT_AVATAR}
                          alt={getUserDisplayName(users.find((u) => u._id === formData.assignedTo))}
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{getUserDisplayName(users.find((u) => u._id === formData.assignedTo))}</span>
                    </div>
                  ) : (
                    t("selectAssignee")
                  )}
                </SelectValue>
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
                      <span>{t("unassigned")}</span>
                    </div>
                  </SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || DEFAULT_AVATAR} alt={getUserDisplayName(user)} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{getUserDisplayName(user)}</span>
                          <span className="text-xs text-muted-foreground dark:text-white/70">{user.email}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
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

        <div className="space-y-2">
          <Label htmlFor="attachments" className="text-foreground">
            {t("Upload Image / PDF")}
          </Label>
          <Input
            id="attachments"
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleFilesUpload}
            className="bg-background border-input text-foreground"
          />
          {attachments.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {attachments.map((att, index) => renderAttachmentPreview(att, index))}
            </div>
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

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedFile?.file.name}</DialogTitle>
          </DialogHeader>
          {selectedFile?.file.type.startsWith("image/") ? (
            <img
              src={selectedFile.dataUrl || "/placeholder.svg"}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          ) : (
            <iframe src={selectedFile?.dataUrl} className="w-full h-[70vh]" title="PDF Preview" />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

