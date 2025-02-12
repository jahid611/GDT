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
import { PDFDocument } from "pdf-lib"
import { sendAssignmentEmail } from "../utils/email"

const DEFAULT_AVATAR =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-L1LHIDu8Qzc1p3IctdN9zpykntVGxf.png"

// Le préfixe à toujours utiliser pour les tâches maintenance
const DEFAULT_PREFIX = "Maintenance | "

export default function TaskCreationFormMaintenance({ onSuccess, onCancel, mode = "create", initialData = null }) {
  // État pour activer/désactiver le préfixe maintenance.
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(true)

  // Pour le titre, nous gérons uniquement la partie modifiable (le suffixe)
  const [titleSuffix, setTitleSuffix] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [deadline, setDeadline] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [assignedTo, setAssignedTo] = useState("")

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

  // Lors d'une édition, on extrait la partie suffixe du titre s'il commence par le préfixe maintenance
  useEffect(() => {
    if (initialData) {
      if (initialData.title && initialData.title.startsWith(DEFAULT_PREFIX)) {
        setTitleSuffix(initialData.title.slice(DEFAULT_PREFIX.length))
      } else {
        setTitleSuffix(initialData.title || "")
      }
      setDescription(initialData.description || "")
      setStatus(initialData.status || "todo")
      setPriority(initialData.priority || "medium")
      setDeadline(initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : "")
      setEstimatedTime(initialData.estimatedTime || "")
      setAssignedTo(initialData.assignedTo?._id || "")
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

  const compressFile = async (file) => {
    const MAX_FILE_SIZE = 26214400 // 25MB
    if (file.size <= MAX_FILE_SIZE) return file
    if (file.type.startsWith("image/")) {
      try {
        const options = {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 2048,
          initialQuality: 0.9,
          useWebWorker: true,
          alwaysKeepResolution: true,
          preserveExif: true,
        }
        let compressedFile = await imageCompression(file, options)
        if (compressedFile.size > MAX_FILE_SIZE) {
          options.maxWidthOrHeight = 1600
          options.initialQuality = 0.8
          compressedFile = await imageCompression(file, options)
        }
        if (compressedFile.size > MAX_FILE_SIZE) {
          options.maxWidthOrHeight = 1200
          options.initialQuality = 0.7
          compressedFile = await imageCompression(file, options)
        }
        if (compressedFile.size <= MAX_FILE_SIZE) return compressedFile
        throw new Error(`Unable to compress image "${file.name}" while maintaining acceptable quality`)
      } catch (err) {
        console.error("Image compression error:", err)
        throw new Error(`Error compressing image "${file.name}"`)
      }
    }
    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        let compressedBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          preserveEditability: false,
        })
        if (compressedBytes.length <= MAX_FILE_SIZE) {
          return new File([compressedBytes], file.name, { type: file.type })
        }
        const pages = pdfDoc.getPages()
        for (const page of pages) {
          try {
            const resources = await page.node.Resources()
            if (!resources) continue
            const xObjects = await resources.lookup("XObject")
            if (!xObjects) continue
            const imageObjects = Object.entries(xObjects.dict).filter(
              ([, obj]) =>
                obj.constructor.name === "PDFImage" || (obj.dictionary && obj.dictionary.get("Subtype") === "Image"),
            )
            for (const [, imageObj] of imageObjects) {
              try {
                if (imageObj.dictionary && imageObj.dictionary.get("BitsPerComponent")) {
                  imageObj.dictionary.set("BitsPerComponent", 4)
                }
              } catch (imgErr) {
                console.warn("Failed to compress image in PDF:", imgErr)
                continue
              }
            }
          } catch (pageErr) {
            console.warn("Failed to process page in PDF:", pageErr)
            continue
          }
        }
        compressedBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          preserveEditability: false,
          objectsPerTick: 50,
        })
        if (compressedBytes.length <= MAX_FILE_SIZE) {
          return new File([compressedBytes], file.name, { type: file.type })
        }
        const aggressiveDoc = await PDFDocument.create()
        const copiedPages = await aggressiveDoc.copyPages(pdfDoc, pdfDoc.getPageIndices())
        copiedPages.forEach((page) => aggressiveDoc.addPage(page))
        compressedBytes = await aggressiveDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          preserveEditability: false,
          objectsPerTick: 25,
          updateFieldAppearances: false,
        })
        if (compressedBytes.length <= MAX_FILE_SIZE) {
          return new File([compressedBytes], file.name, { type: file.type })
        }
        throw new Error(
          `PDF "${file.name}" is too large (${(file.size / 1024).toFixed(1)}KB). Even after compression, it's ${(compressedBytes.length / 1024).toFixed(1)}KB. Please try a smaller PDF or one with fewer images.`,
        )
      } catch (err) {
        console.error("PDF compression error:", err)
        throw new Error(`Unable to compress PDF "${file.name}". Error: ${err.message || "Unknown error"}`)
      }
    }
    try {
      const arrayBuffer = await file.arrayBuffer()
      const compressedBuffer = pako.deflate(new Uint8Array(arrayBuffer), {
        level: 9,
        memLevel: 9,
        strategy: 2,
      })
      if (compressedBuffer.length <= MAX_FILE_SIZE) {
        return new File([compressedBuffer], file.name, { type: file.type })
      }
      throw new Error(
        `File "${file.name}" is too large (${(file.size / 1024).toFixed(1)}KB) and cannot be compressed below 25MB.`,
      )
    } catch (err) {
      console.error("File compression error:", err)
      throw new Error(`Error compressing "${file.name}": ${err.message || "Unknown error"}`)
    }
  }

  const handleFilesUpload = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newAttachments = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          const compressedFile = await compressFile(file)
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => resolve(event.target.result)
            reader.onerror = (error) => reject(error)
            reader.readAsDataURL(compressedFile)
          })
          newAttachments.push({ file: compressedFile, dataUrl })
          showToast(t("success"), `${file.name} compressed successfully`, "success")
        } catch (err) {
          console.error("Error processing file:", err)
          showToast(t("error"), err.message || `Error processing ${file.name}`, "destructive")
          continue
        }
      }
      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  const handleViewFile = (file, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setSelectedFile(file)
    setViewerOpen(true)
  }

  const renderAttachmentPreview = (att, index) => {
    if (!att || !att.file || !att.dataUrl) return null
    const previewClasses =
      "relative group aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all duration-200"
    if (att.file.type.startsWith("image/")) {
      return (
        <div key={index} className={previewClasses}>
          <img
            src={att.dataUrl || "/placeholder.svg"}
            alt={`Preview ${index}`}
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            className="absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"
            onClick={(e) => handleViewFile(att, e)}
          >
            View Image
          </Button>
        </div>
      )
    } else if (att.file.type === "application/pdf") {
      return (
        <div key={index} className={previewClasses}>
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
          <Button
            type="button"
            variant="ghost"
            className="absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"
            onClick={(e) => handleViewFile(att, e)}
          >
            View PDF
          </Button>
        </div>
      )
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loadingUsers) return

    try {
      setLoading(true)
      const formDataToSend = new FormData()

      // Concaténer le préfixe et le suffixe si le mode maintenance est activé
      const finalTitle = maintenanceEnabled ? DEFAULT_PREFIX + titleSuffix : titleSuffix
      formDataToSend.append("title", finalTitle)

      formDataToSend.append("description", description)
      formDataToSend.append("status", status)
      formDataToSend.append("priority", priority)
      formDataToSend.append("deadline", deadline)
      formDataToSend.append("estimatedTime", estimatedTime)
      formDataToSend.append("assignedTo", assignedTo)

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

      if (assignedTo) {
        await sendAssignmentEmail({
          title: finalTitle,
          description,
          status,
          priority,
          deadline,
          estimatedTime,
          assignedTo,
        })
      }

      showToast(t("success"), mode === "edit" ? t("taskModified") : t("taskCreated"))
      if (onSuccess) onSuccess(result)
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

  function getUserDisplayName(user) {
    if (!user) return ""
    return user.name || user.username || user.email.split("@")[0]
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4 px-4 sm:px-0">
        <Label className="text-foreground inline-flex items-center gap-2">
          <span>{t("maintenanceMode")}</span>
          <input
            type="checkbox"
            checked={maintenanceEnabled}
            onChange={(e) => {
              setMaintenanceEnabled(e.target.checked)
              setTitleSuffix((prev) => (e.target.checked ? prev : prev.replace(/^Maintenance \| /, "")))
            }}
            className="w-5 h-5 rounded border-input"
          />
        </Label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 px-4 sm:px-0">
          <Label htmlFor="title" className="text-foreground text-sm font-medium">
            {t("title")}
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            {maintenanceEnabled && (
              <Input
                value={DEFAULT_PREFIX}
                readOnly
                className="w-full sm:w-40 bg-muted border-input text-muted-foreground cursor-not-allowed text-sm"
              />
            )}
            <Input
              id="title"
              value={titleSuffix}
              onChange={(e) => setTitleSuffix(e.target.value)}
              required
              className="flex-1 bg-background border-input text-foreground text-sm"
              placeholder={maintenanceEnabled ? t("enterTitle") : t("enterFullTitle")}
            />
          </div>
        </div>

        <div className="space-y-2 px-4 sm:px-0">
          <Label htmlFor="description" className="text-foreground text-sm font-medium">
            {t("description")}
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="min-h-[120px] bg-background border-input text-foreground resize-y text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-0">
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">{t("priority")}</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value)}>
              <SelectTrigger className="bg-background border-input text-foreground h-10">
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
            <Label className="text-foreground text-sm font-medium">{t("status")}</Label>
            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger className="bg-background border-input text-foreground h-10">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-0">
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">{t("deadline")}</Label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-background border-input text-foreground h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedTime" className="text-foreground text-sm font-medium">
              {t("estimatedTime")}
            </Label>
            <Input
              id="estimatedTime"
              type="number"
              min="0"
              step="0.5"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="bg-background border-input text-foreground h-10"
            />
          </div>
        </div>

        <div className="space-y-2 px-4 sm:px-0">
          <Label className="text-foreground text-sm font-medium">{t("assignedTo")}</Label>
          <div className="relative">
            <Select value={assignedTo} onValueChange={(value) => setAssignedTo(value)} disabled={loadingUsers}>
              <SelectTrigger className="w-full bg-background border-input text-foreground h-10">
                <SelectValue>
                  {assignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={users.find((u) => u._id === assignedTo)?.avatar || DEFAULT_AVATAR}
                          alt={getUserDisplayName(users.find((u) => u._id === assignedTo))}
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{getUserDisplayName(users.find((u) => u._id === assignedTo))}</span>
                    </div>
                  ) : (
                    t("selectAssignee")
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px] sm:h-[300px]">
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
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{getUserDisplayName(user)}</span>
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
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
            <p className="text-sm text-destructive mt-1 flex items-center gap-2">
              <span>{userError}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadUsers}
                className="h-8 px-2 hover:bg-destructive/10"
              >
                {t("retry")}
              </Button>
            </p>
          )}
        </div>

        <div className="space-y-2 px-4 sm:px-0">
          <Label htmlFor="attachments" className="text-foreground text-sm font-medium">
            {t("uploadImagePDF")}
          </Label>
          <Input
            id="attachments"
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            multiple
            onChange={handleFilesUpload}
            className="bg-background border-input text-foreground file:bg-transparent file:border-0 file:text-sm file:font-medium cursor-pointer"
          />
          {attachments.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {attachments.map((att, index) => renderAttachmentPreview(att, index))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-4 sm:px-0 pb-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto bg-background border-input text-foreground hover:bg-accent"
            >
              {t("cancel")}
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || loadingUsers}
            className="w-full sm:w-auto bg-primary text-primary-foreground"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{mode === "edit" ? t("modifying") : t("creating")}</span>
              </>
            ) : (
              <span>{mode === "edit" ? t("editTask") : t("createTask")}</span>
            )}
          </Button>
        </div>
      </form>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-sm sm:text-base truncate pr-8">{selectedFile?.file.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-2 sm:p-4">
            {selectedFile?.file.type.startsWith("image/") ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={selectedFile.dataUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <iframe src={selectedFile?.dataUrl} className="w-full h-full" title="PDF Preview" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getUserDisplayName(user) {
  if (!user) return ""
  return user.name || user.username || user.email.split("@")[0]
}

