"use client";

import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import pako from "pako";
import { createTask, updateTask, getUsers } from "../utils/api";
import { sendAssignmentEmail } from "../utils/email";
import { useNotifications } from "../contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PDFDocument } from "pdf-lib";
import { AnimatePresence, motion } from "framer-motion";

// Définition de DEFAULT_AVATAR et avatars par défaut
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=??&backgroundColor=52,53,65,255";
const DEFAULT_AVATARS = {
  user1: "https://api.dicebear.com/7.x/initials/svg?seed=JD&backgroundColor=52,53,65,255",
  user2: "https://api.dicebear.com/7.x/initials/svg?seed=AB&backgroundColor=52,53,65,255",
  user3: "https://api.dicebear.com/7.x/initials/svg?seed=CD&backgroundColor=52,53,65,255",
  user4: "https://api.dicebear.com/7.x/initials/svg?seed=EF&backgroundColor=52,53,65,255",
};

const getAvatarForUser = (email) => {
  if (!email) return DEFAULT_AVATAR;
  const hash = email.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const avatarSet = Object.values(DEFAULT_AVATARS);
  const index = Math.abs(hash) % avatarSet.length;
  return avatarSet[index];
};

export default function CreateTeamTask({
  onSuccess,
  onCancel,
  mode = "create",
  initialData = null,
  team,
  currentUser,
}) {
  // Activation du préfixe dynamique (nom de l'équipe suivi de " | ")
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(true);

  // États pour les champs du formulaire
  const [titleSuffix, setTitleSuffix] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // L'état pour une éventuelle boîte latérale des tâches complétées (non utilisé ici)
  const [isCompletedPanelOpen, setIsCompletedPanelOpen] = useState(false);

  const { showToast } = useNotifications();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Le préfixe est le nom de l'équipe suivi de " | "
  const teamPrefix = `${team?.name || ""} | `;

  // Lors d'une édition, extraire la partie suffixe du titre
  useEffect(() => {
    if (initialData) {
      const title = initialData.title || "";
      if (title.startsWith(teamPrefix)) {
        setTitleSuffix(title.slice(teamPrefix.length));
      } else {
        setTitleSuffix(title);
      }
      setDescription(initialData.description || "");
      setStatus(initialData.status || "todo");
      setPriority(initialData.priority || "medium");
      setDeadline(
        initialData.deadline
          ? new Date(initialData.deadline).toISOString().slice(0, 16)
          : ""
      );
      setEstimatedTime(initialData.estimatedTime || "");
      setAssignedTo(initialData.assignedTo?._id || "");
    }
  }, [initialData, teamPrefix]);

  // Pour le champ "Assigné à", nous souhaitons n'afficher que les membres de l'équipe.
  // Ici, nous simulons le chargement puisque la liste des membres est déjà dans team.members.
  useEffect(() => {
    setLoadingUsers(false);
  }, []);

  const handleFilesUpload = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const compressedFile = await compressFile(file);
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(compressedFile);
          });
          newAttachments.push({ file: compressedFile, dataUrl });
          showToast(t("success"), `${file.name} compressed successfully`, "success");
        } catch (err) {
          console.error("Error processing file:", err);
          showToast(t("error"), err.message || `Error processing ${file.name}`, "destructive");
          continue;
        }
      }
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const compressFile = async (file) => {
    const MAX_FILE_SIZE = 26214400; // 25MB
    if (file.size <= MAX_FILE_SIZE) return file;
    if (file.type.startsWith("image/")) {
      try {
        const options = {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 2048,
          initialQuality: 0.9,
          useWebWorker: true,
          alwaysKeepResolution: true,
          preserveExif: true,
        };
        let compressedFile = await imageCompression(file, options);
        if (compressedFile.size > MAX_FILE_SIZE) {
          options.maxWidthOrHeight = 1600;
          options.initialQuality = 0.8;
          compressedFile = await imageCompression(file, options);
        }
        if (compressedFile.size > MAX_FILE_SIZE) {
          options.maxWidthOrHeight = 1200;
          options.initialQuality = 0.7;
          compressedFile = await imageCompression(file, options);
        }
        if (compressedFile.size <= MAX_FILE_SIZE) return compressedFile;
        throw new Error(`Unable to compress image "${file.name}" while maintaining acceptable quality`);
      } catch (err) {
        console.error("Image compression error:", err);
        throw new Error(`Error compressing image "${file.name}"`);
      }
    }
    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        let compressedBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          preserveEditability: false,
        });
        if (compressedBytes.length <= MAX_FILE_SIZE) {
          return new File([compressedBytes], file.name, { type: file.type });
        }
        throw new Error(`PDF "${file.name}" is too large and cannot be compressed below 25MB.`);
      } catch (err) {
        console.error("PDF compression error:", err);
        throw new Error(`Unable to compress PDF "${file.name}". Error: ${err.message || "Unknown error"}`);
      }
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const compressedBuffer = pako.deflate(new Uint8Array(arrayBuffer), {
        level: 9,
        memLevel: 9,
        strategy: 2,
      });
      if (compressedBuffer.length <= MAX_FILE_SIZE) {
        return new File([compressedBuffer], file.name, { type: file.type });
      }
      throw new Error(`File "${file.name}" is too large and cannot be compressed below 25MB.`);
    } catch (err) {
      console.error("File compression error:", err);
      throw new Error(`Error compressing "${file.name}": ${err.message || "Unknown error"}`);
    }
  };

  const handleViewFile = (file, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedFile(file);
    setViewerOpen(true);
  };

  const renderAttachmentPreview = (att, index) => {
    if (!att || !att.file || !att.dataUrl) return null;
    const previewClasses = "relative aspect-square rounded-lg overflow-hidden transition-all duration-200";
    if (att.file.type.startsWith("image/")) {
      return (
        <div key={index} className={previewClasses}>
          <img src={att.dataUrl || "/placeholder.svg"} alt={`Preview ${index}`} className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="ghost"
            className="absolute inset-0 w-full h-full bg-black/50 opacity-0 transition-opacity text-white"
            onClick={(e) => handleViewFile(att, e)}
          >
            View Image
          </Button>
        </div>
      );
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
            className="absolute inset-0 w-full h-full bg-black/50 opacity-0 transition-opacity text-white"
            onClick={(e) => handleViewFile(att, e)}
          >
            View PDF
          </Button>
        </div>
      );
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loadingUsers) return;

    try {
      setLoading(true);
      const formDataToSend = new FormData();

      // Concaténer le préfixe (nom de l'équipe) et le suffixe pour le titre
      const finalTitle = teamPrefix + titleSuffix;
      formDataToSend.append("title", finalTitle);
      formDataToSend.append("description", description);
      formDataToSend.append("status", status);
      formDataToSend.append("priority", priority);
      formDataToSend.append("deadline", deadline);
      formDataToSend.append("estimatedTime", estimatedTime);
      
      // Si "null" est sélectionné, utiliser l'ID du currentUser (leader)
      const finalAssignedTo = assignedTo === "null" ? (currentUser?.id || currentUser?._id) : assignedTo;
      formDataToSend.append("assignedTo", finalAssignedTo);

      // Ajout de l'image principale si disponible
      if (attachments.length > 0) {
        formDataToSend.append("imageUrl", attachments[0].dataUrl);
      }
      attachments.forEach((att) => {
        formDataToSend.append("attachments", att.file);
      });

      // Ajout du créateur
      formDataToSend.append("createdBy", currentUser?.id || currentUser?._id);

      let result;
      if (mode === "edit" && initialData?._id) {
        result = await updateTask(initialData._id, formDataToSend);
      } else {
        result = await createTask(formDataToSend);
      }

      // Envoi de l'email d'assignation
      // On envoie l'email même si finalAssignedTo est présent (leader ou membre)
      if (finalAssignedTo) {
        await sendAssignmentEmail({
          title: finalTitle,
          description,
          status,
          priority,
          deadline,
          estimatedTime,
          assignedTo: finalAssignedTo,
        });
      }

      showToast(t("success"), mode === "edit" ? t("taskModified") : t("taskCreated"));
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error("Error handling task:", err);
      showToast(
        t("error"),
        err.message || (mode === "edit" ? t("cannotModifyTask") : t("cannotCreateTask")),
        "destructive"
      );
    } finally {
      setLoading(false);
    }
  };

  // Rendu des options pour le champ "Assigné à" : seuls les membres de l'équipe + option pour la team
  const renderAssigneeOptions = () => (
    <>
      <SelectItem value="null">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span>{team.name}</span>
        </div>
      </SelectItem>
      {team.members &&
        team.members.map((member) => (
          <SelectItem key={member._id} value={member._id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.avatar || getAvatarForUser(member.email)} alt={member.name} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{member.name || member.email.split("@")[0]}</span>
                <span className="text-xs text-muted-foreground dark:text-white/70">{member.email}</span>
              </div>
            </div>
          </SelectItem>
        ))}
    </>
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-3xl mx-auto px-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground text-sm font-medium">
            {t("title")}
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={teamPrefix}
              readOnly
              className="w-full sm:w-40 bg-gray-100 dark:bg-gray-700 border-input text-foreground cursor-not-allowed text-sm"
            />
            <Input
              id="title"
              value={titleSuffix}
              onChange={(e) => setTitleSuffix(e.target.value)}
              required
              className="flex-1 bg-background border-input text-foreground text-sm"
              placeholder={t("taskTitle")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground text-sm font-medium">
            {t("description")}
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="min-h-[100px] bg-background border-input text-foreground resize-y text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

        {/* Champ "Assigné à" restreint aux membres de l'équipe + option team */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">{t("assignedTo")}</Label>
          <div className="relative">
            <Select value={assignedTo} onValueChange={(value) => setAssignedTo(value)} disabled={loadingUsers}>
              <SelectTrigger className="w-full bg-background border-input text-foreground h-10">
                <SelectValue>
                  {assignedTo && assignedTo !== "null" ? (
                    (() => {
                      const member = team.members?.find((m) => m._id === assignedTo);
                      return member ? member.name || member.email : t("selectAssignee");
                    })()
                  ) : assignedTo === "null" ? (
                    team.name
                  ) : (
                    t("selectAssignee")
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px] sm:h-[300px]">
                  {renderAssigneeOptions()}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          {loadingUsers && (
            <div className="absolute right-3 top-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {userError && (
            <p className="text-sm text-destructive mt-1 flex items-center gap-2">
              <span>{userError}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {}}
                className="h-8 px-2 hover:bg-destructive/10"
              >
                {t("retry")}
              </Button>
            </p>
          )}
        </div>

        <div className="space-y-2">
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

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pb-4">
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
          <Button type="submit" disabled={loading || loadingUsers} className="w-full sm:w-auto bg-primary text-primary-foreground">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{mode === "edit" ? t("modifying") : t("creating")}</span>
              </>
            ) : mode === "edit" ? (
              <span>{t("editTask")}</span>
            ) : (
              <span>{t("createTask")}</span>
            )}
          </Button>
        </div>
      </form>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] overflow-auto p-2 md:p-6">
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
  );
}
