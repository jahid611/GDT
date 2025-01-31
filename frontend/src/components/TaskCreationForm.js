import { useState, useEffect } from "react"
import { createTask, updateTask, getUsers, createNotification } from "../utils/api"
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
import { sendAssignmentEmail } from "../utils/email";

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
    e.preventDefault();
    if (loadingUsers) return;

    try {
        setLoading(true);
        let result;

        if (mode === "edit" && initialData?._id) {
            result = await updateTask(initialData._id, formData);
        } else {
            result = await createTask({
                ...formData,
                createdBy: user.id,
            });
        }

        // Attendre que les utilisateurs soient bien chargés avant d'envoyer l'e-mail
        setTimeout(async () => {
            console.log("🔄 Vérification avant envoi d'e-mail...");
            const users = await getUsers();

            if (users.length === 0) {
                console.error("❌ Impossible d'envoyer l'email, liste des utilisateurs vide.");
                return;
            }

            if (formData.assignedTo) {
                await sendAssignmentEmail(formData);
            }
        }, 2000); // 2 secondes de délai pour éviter les conflits

        showToast(
            t("success"),
            mode === "edit" ? t("taskModified") : t("taskCreated")
        );

        if (onSuccess) {
            onSuccess(result);
        }
    } catch (err) {
        console.error("Erreur lors de la gestion de la tâche :", err);
        showToast(
            t("error"),
            err.message || (mode === "edit" ? t("cannotModifyTask") : t("cannotCreateTask")),
            "destructive"
        );
    } finally {
        setLoading(false);
    }
};






  const getUserDisplayName = (user) => {
    if (!user) return ""
    return user.name || user.username || user.email.split("@")[0]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground">
          {t("title")}
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="min-h-[100px] bg-background border-input text-foreground resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">{t("priority")}</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">{t("deadline")}</Label>
          <Input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
            className="bg-background border-input text-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">{t("assignedTo")}</Label>
        <div className="relative">
          <Select
            value={formData.assignedTo}
            onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
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

