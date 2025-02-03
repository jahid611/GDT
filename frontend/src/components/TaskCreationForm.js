"use client"

import { useState, useEffect } from "react"
import imageCompression from "browser-image-compression"
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
import emailjs from "emailjs-com"

// Remplacez ces valeurs par vos identifiants EmailJS réels
const EMAILJS_SERVICE_ID = "service_jhd"
const EMAILJS_TEMPLATE_ID = "template_jhd"
const EMAILJS_USER_ID = "FiWAOQdkaG34q5-hc"

const DEFAULT_AVATAR =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-L1LHIDu8Qzc1p3IctdN9zpykntVGxf.png"

export default function TaskCreationForm({ onSuccess, onCancel, mode = "create", initialData = null }) {
  // États pour les champs texte du formulaire
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    deadline: "",
    estimatedTime: "",
    assignedTo: "",
  })
  // États pour stocker les fichiers joints (images et PDFs)
  const [attachments, setAttachments] = useState([]) // Chaque élément: { file, dataUrl }
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userError, setUserError] = useState("")
  const { showToast } = useNotifications()
  const { user } = useAuth()
  const { t } = useTranslation()

  // Initialisation des champs en mode édition
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        status: initialData.status || "todo",
        priority: initialData.priority || "medium",
        deadline: initialData.deadline
          ? new Date(initialData.deadline).toISOString().slice(0, 16)
          : "",
        estimatedTime: initialData.estimatedTime || "",
        assignedTo: initialData.assignedTo?._id || "",
      })
      // Si initialData contient déjà des attachments, vous pouvez les intégrer ici
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

  // Gestion de l'upload de plusieurs fichiers (images et PDFs)
  const handleFilesUpload = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newAttachments = []
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        // Vérifier que le fichier est une image ou un PDF
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
          showToast(t("error"), "Type de fichier non accepté", "destructive")
          continue
        }
        // Pour les images, compresser si taille > 100 KB
        if (file.type.startsWith("image/") && file.size > 102400) {
          try {
            const options = {
              maxSizeMB: 0.1, // Environ 100 KB
              maxWidthOrHeight: 800,
              useWebWorker: true,
            }
            file = await imageCompression(file, options)
          } catch (err) {
            console.error("Erreur de compression de l'image :", err)
          }
        }
        // Pour les PDFs, si trop volumineux, on affiche un avertissement mais on continue
        if (file.type === "application/pdf" && file.size > 102400) {
          showToast(t("warning"), "Fichier PDF volumineux, vérifiez la configuration du serveur", "warning")
          // Vous pouvez décider de rejeter le fichier en ajoutant 'continue' ici,
          // ou d'autoriser son envoi (mais cela peut provoquer l'erreur PayloadTooLarge)
        }
        // Conversion en Data URL pour prévisualisation
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (event) => resolve(event.target.result)
          reader.onerror = (error) => reject(error)
          reader.readAsDataURL(file)
        })
        newAttachments.push({ file, dataUrl })
      }
      // Ajoute les nouveaux fichiers aux attachments existants
      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  // Fonction d'envoi d'e-mail via EmailJS
  // L'e-mail inclut le statut, la priorité, la date limite et le nombre de fichiers joints.
  const sendEmailNotification = async (task) => {
    try {
      // Récupère l'utilisateur assigné (s'il existe)
      const assignedUser = users.find((u) => u._id === task.assignedTo)
      // Le destinataire sera l'utilisateur assigné ou, à défaut, le créateur
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

  // Fonction de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loadingUsers) return

    try {
      setLoading(true)
      const formDataToSend = new FormData()

      // Ajoute les champs textes du formulaire
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key])
        }
      })

      // Si des fichiers ont été uploadés, on ajoute la Data URL de la première image dans "imageUrl"
      const firstImageAttachment = attachments.find((att) => att.file.type.startsWith("image/"))
      if (firstImageAttachment) {
        formDataToSend.append("imageUrl", firstImageAttachment.dataUrl)
      }

      // Ajoute chaque fichier dans "attachments"
      attachments.forEach((att) => {
        formDataToSend.append("attachments", att.file)
      })

      // Ajoute l'ID du créateur
      formDataToSend.append("createdBy", user.id)

      let result
      if (mode === "edit" && initialData?._id) {
        result = await updateTask(initialData._id, formDataToSend)
      } else {
        result = await createTask(formDataToSend)
      }

      showToast(t("success"), mode === "edit" ? t("taskModified") : t("taskCreated"))

      // Envoi de l'e-mail via EmailJS avec les informations supplémentaires
      await sendEmailNotification(result)

      if (onSuccess) onSuccess(result)
    } catch (err) {
      console.error("Erreur lors de la gestion de la tâche :", err)
      showToast(
        t("error"),
        err.message || (mode === "edit" ? t("cannotModifyTask") : t("cannotCreateTask")),
        "destructive"
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titre */}
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

      {/* Description */}
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

      {/* Champs pour priorité et statut */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Champs pour date limite et temps estimé */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Sélection de l'utilisateur assigné */}
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

      {/* Champ pour uploader plusieurs fichiers (images et PDFs) */}
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
        {/* Prévisualisation des fichiers joints */}
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <div key={index} className="border p-1">
                {att.file.type.startsWith("image/") ? (
                  <img src={att.dataUrl} alt={`Aperçu ${index}`} className="w-24 h-24 object-cover" />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-gray-100">
                    <span className="text-xs">PDF</span>
                  </div>
                )}
              </div>
            ))}
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
  )
}
