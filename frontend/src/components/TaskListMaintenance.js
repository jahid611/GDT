"use client";

import { useState, useMemo, useEffect } from "react";
import { fetchTasks, updateTask, deleteTask } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Calendar,
  RefreshCw,
  BarChart2,
  Trash2,
  MoreVertical,
  Edit,
  ImageIcon,
  FileText,
  AlertCircle,
} from "lucide-react";
import { SortAsc, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { enUS, fr, ro } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import TaskEditDialog from "./TaskEditDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Avatars par défaut pour l'affichage utilisateur
const DEFAULT_AVATARS = {
  user1: "https://api.dicebear.com/7.x/initials/svg?seed=JD&backgroundColor=52,53,65,255",
  user2: "https://api.dicebear.com/7.x/initials/svg?seed=AB&backgroundColor=52,53,65,255",
  user3: "https://api.dicebear.com/7.x/initials/svg?seed=CD&backgroundColor=52,53,65,255",
  user4: "https://api.dicebear.com/7.x/initials/svg?seed=EF&backgroundColor=52,53,65,255",
};

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=??&backgroundColor=52,53,65,255";

// Fonction qui attribue un avatar basé sur l'email
const getAvatarForUser = (email) => {
  if (!email) return DEFAULT_AVATAR;
  const hash = email.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const avatarSet = Object.values(DEFAULT_AVATARS);
  const index = Math.abs(hash) % avatarSet.length;
  return avatarSet[index];
};

/**
 * Modal de confirmation pour l'accès à la section Maintenance.
 * Seuls les membres de l'équipe maintenance peuvent accéder.
 */
function MaintenanceAccessModal({ open, onConfirm, onReject }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 sm:p-8 max-w-lg w-full mx-4 relative"
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={onReject}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            ✖
          </button>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          🔧 Accès à la Maintenance
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Seuls les membres de l'équipe maintenance peuvent accéder à cette section.
          Confirmez-vous en faire partie ?
        </p>
        <div className="flex justify-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onReject}
          >
            ❌ Non, je ne suis pas membre
          </Button>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-all"
            onClick={onConfirm}
          >
            ✅ Oui, je suis membre
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Composant TaskListMaintenance
 * Affiche uniquement les tâches dont le titre commence par "Maintenance | ".
 */
export default function TaskListMaintenance({ newTask }) {
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("deadline");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  // Contrôle d'accès à la section Maintenance
  const [accessGranted, setAccessGranted] = useState(false);

  // Filtrer les tâches de maintenance
  const filterMaintenanceTasks = (allTasks) =>
    allTasks.filter((task) => task.title && task.title.startsWith("Maintenance | "));

  const getLocale = () => {
    switch (language) {
      case "fr":
        return fr;
      case "ro":
        return ro;
      default:
        return enUS;
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTasks = await fetchTasks();
      const maintenanceTasks = filterMaintenanceTasks(fetchedTasks);
      setTasks(maintenanceTasks);
    } catch (error) {
      setError(error);
      showToast("error", t("errorLoadingTasks"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessGranted) {
      loadTasks();
    }
  }, [newTask, sortBy, filterStatus, filterPriority, language, accessGranted]);

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      showToast("success", t("taskDeleted"));
    } catch (error) {
      console.error("Error deleting task:", error);
      showToast("error", t("taskDeleteError"));
    }
  };

  const handleDeleteAllTasks = async () => {
    try {
      setLoading(true);
      await Promise.all(tasks.map((task) => deleteTask(task._id)));
      setTasks([]);
      showToast("success", t("allTasksDeleted"));
    } catch (error) {
      console.error("Error deleting all tasks:", error);
      showToast("error", t("errorDeletingAllTasks"));
    } finally {
      setLoading(false);
      setIsDeleteAllDialogOpen(false);
    }
  };

  const handleStatusUpdate = async (taskId, currentStatus) => {
    const newStatus = getNextStatus(currentStatus);
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task))
      );
      showToast("success", t("statusUpdated"));
    } catch (error) {
      console.error("Error updating task status:", error);
      showToast("error", t("statusUpdateError"));
    }
  };

  const getNextStatus = (status) => {
    switch (status) {
      case "todo":
        return "in_progress";
      case "in_progress":
        return "review";
      case "review":
        return "done";
      default:
        return "todo";
    }
  };

  const getStatusColor = (status) => "bg-muted/50 text-muted-foreground";

  const getStatusLabel = (status) => {
    switch (status) {
      case "todo":
        return t("todo");
      case "in_progress":
        return t("inProgress");
      case "review":
        return t("review");
      case "done":
        return t("done");
      default:
        return "";
    }
  };

  const getPriorityColor = (priority) => "bg-muted/50 text-muted-foreground";

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return t("high");
      case "medium":
        return t("medium");
      case "low":
        return t("low");
      default:
        return "";
    }
  };

  // Pour harmoniser le look en mode dark, nous utilisons un fond sombre global
  const getCardBackground = (status) => {
    // Vous pouvez affiner cette fonction pour adapter les couleurs selon le statut.
    // Ici, nous conservons un fond uniforme qui s'intègre au thème de l'application.
    return "bg-[#1B1A1A] border-[#323131]";
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityOrder = (priority) => {
    switch (priority) {
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  };

  const getStatusOrder = (status) => {
    switch (status) {
      case "todo":
        return 1;
      case "in_progress":
        return 2;
      case "review":
        return 3;
      case "done":
        return 4;
      default:
        return 0;
    }
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (sortBy === "priority") {
      return getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
    } else if (sortBy === "status") {
      return getStatusOrder(a.status) - getStatusOrder(b.status);
    }
    return 0;
  });

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
    );
    setIsEditDialogOpen(false);
  };

  const handleViewImage = (task) => {
    if (task.imageUrl) {
      fetch(task.imageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
        })
        .catch((err) => console.error("Error opening image:", err));
    }
  };

  const handleViewPDF = (task) => {
    if (task.attachments && Array.isArray(task.attachments)) {
      const pdfAttachment = task.attachments.find(
        (att) => att.dataUrl && att.dataUrl.startsWith("data:application/pdf")
      );
      if (pdfAttachment) {
        window.open(pdfAttachment.dataUrl, "_blank");
      } else {
        showToast("error", t("noPDFFound"));
      }
    } else {
      showToast("error", t("noPDFFound"));
    }
  };

  // Affiche la modal d'accès à la maintenance si l'accès n'est pas encore accordé
  if (!accessGranted) {
    return (
      <MaintenanceAccessModal
        open={!accessGranted}
        onConfirm={() => setAccessGranted(true)}
        onReject={() =>
          showToast("error", "Access denied. You are not a maintenance team member.")
        }
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-gray-900/90 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4"
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                {t("maintenanceTasks")}
              </h2>
              <p className="text-xs sm:text-sm text-gray-300">
                {sortedTasks.length} {t("tasks")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadTasks}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:opacity-90"
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1.5 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
                <span className="text-xs sm:text-sm">{t("refresh")}</span>
              </Button>
              <Button
                onClick={() => setIsDeleteAllDialogOpen(true)}
                variant="destructive"
                size="sm"
                disabled={tasks.length === 0 || loading}
                className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm">{t("deleteAll")}</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm bg-gray-800 border-gray-700 text-white">
                <SortAsc className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 text-gray-300" />
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent sideOffset={8}>
                <SelectItem value="deadline">{t("deadline")}</SelectItem>
                <SelectItem value="priority">{t("priority")}</SelectItem>
                <SelectItem value="status">{t("status")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm bg-gray-800 border-gray-700 text-white">
                <Filter className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 text-gray-300" />
                <SelectValue placeholder={t("filterByStatus")} />
              </SelectTrigger>
              <SelectContent sideOffset={8}>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="todo">{t("todo")}</SelectItem>
                <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                <SelectItem value="review">{t("review")}</SelectItem>
                <SelectItem value="done">{t("done")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm bg-gray-800 border-gray-700 text-white">
                <AlertCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2 text-gray-300" />
                <SelectValue placeholder={t("filterByPriority")} />
              </SelectTrigger>
              <SelectContent sideOffset={8}>
                <SelectItem value="all">{t("allPriorities")}</SelectItem>
                <SelectItem value="high">{t("high")}</SelectItem>
                <SelectItem value="medium">{t("medium")}</SelectItem>
                <SelectItem value="low">{t("low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <div className="pt-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center p-8"
            >
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-2 text-gray-300">{t("loadingTasks")}</span>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-destructive/10 text-destructive p-4 rounded-lg"
            >
              {error}
              <Button variant="link" onClick={loadTasks} className="ml-2 text-destructive">
                {t("tryAgain")}
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full p-8 text-center"
                >
                  <p className="text-gray-300">{t("noTasksFound")}</p>
                </motion.div>
              ) : (
                sortedTasks.map((task, index) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300",
                      "border border-gray-700",
                      getCardBackground(task.status)
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-3 sm:p-4 space-y-3 sm:space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-sm sm:text-base tracking-tight line-clamp-2 text-white">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {task.imageUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewImage(task)}
                              className="h-8 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                              <ImageIcon className="h-4 w-4" />
                              <span className="text-xs text-white">{t("viewImage")}</span>
                            </Button>
                          )}
                          {task.attachments &&
                            Array.isArray(task.attachments) &&
                            task.attachments.some(
                              (att) => att.dataUrl && att.dataUrl.startsWith("data:application/pdf")
                            ) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPDF(task)}
                                className="h-8 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs text-white">{t("viewPDF")}</span>
                              </Button>
                            )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 sm:w-48">
                              <DropdownMenuItem onClick={() => handleEditTask(task)} className="text-xs sm:text-sm">
                                <Edit className="mr-2 h-3.5 w-3.5" />
                                {t("edit")}
                              </DropdownMenuItem>
                              {task.status !== "done" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(task._id, task.status)}
                                  className="text-xs sm:text-sm"
                                >
                                  <CheckCircle className="mr-2 h-3.5 w-3.5" />
                                  {t("advanceStatus")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-destructive text-xs sm:text-sm"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 sm:line-clamp-3">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                      <div className="grid gap-2 mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{t("status")}:</span>
                          <span className="font-medium">{getStatusLabel(task.status)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{t("priority")}:</span>
                          <span className="font-medium">{getPriorityLabel(task.priority)}</span>
                        </div>
                        {task.deadline && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{t("deadline")}:</span>
                            <span
                              className={cn(
                                "font-medium",
                                new Date(task.deadline) < new Date() && "text-destructive"
                              )}
                            >
                              {format(new Date(task.deadline), "Pp", { locale: getLocale() })}
                            </span>
                          </div>
                        )}
                        {task.estimatedTime && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{t("estimatedTime")}:</span>
                            <span className="font-medium">
                              {task.estimatedTime}h {t("estimated")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pt-3 sm:pt-4 border-t border-gray-700 space-y-3 sm:space-y-4">
                        <div className="grid gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                              <AvatarImage
                                src={task.createdBy?.avatar || getAvatarForUser(task.createdBy?.email)}
                                alt={`${t("avatarOf")} ${task.createdBy?.email || t("user")}`}
                              />
                              <AvatarFallback className="text-xs sm:text-sm bg-primary/10">
                                {task.createdBy?.email?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-[10px] sm:text-xs text-gray-400">
                                {t("createdBy")}
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[150px] sm:max-w-[200px]">
                                {task.createdBy?.email}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                              <AvatarImage
                                src={task.assignedTo?.avatar || getAvatarForUser(task.assignedTo?.email)}
                                alt={`${t("avatarOf")} ${task.assignedTo?.email || t("user")}`}
                              />
                              <AvatarFallback className="text-xs sm:text-sm bg-secondary/10">
                                {task.assignedTo?.email?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-[10px] sm:text-xs text-gray-400">
                                {t("assignedTo")}
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[150px] sm:max-w-[200px]">
                                {task.assignedTo?.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(new Date(task.createdAt || new Date()), "Pp", { locale: getLocale() })}</span>
                          </div>
                          {task.updatedAt && task.updatedAt !== task.createdAt && (
                            <div className="flex items-center gap-2">
                              <Edit className="h-3.5 w-3.5" />
                              <span>
                                {t("lastUpdated")}: {format(new Date(task.updatedAt), "Pp", { locale: getLocale() })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      <TaskEditDialog
        task={selectedTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={handleTaskUpdated}
      />

      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAllTasks")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAllTasksConfirmation")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllTasks}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getUserDisplayName(user) {
  if (!user) return "";
  return user.name || user.username || user.email.split("@")[0];
}
