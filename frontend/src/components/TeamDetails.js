"use client";

import { useState, useEffect } from "react";
import { fetchTasks, updateTask, deleteTask } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Calendar,
  RefreshCw,
  Trash2,
  MoreVertical,
  Edit,
  ImageIcon,
  FileText,
  AlertCircle,
  Plus,
  SortAsc,
  Filter,
  Loader2,
  Search,
  User,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { format } from "date-fns";
import { enUS, fr, ro } from "date-fns/locale";

import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import TaskEditDialog from "./TaskEditDialog";
import CreateTaskModal from "./CreateTaskModal";

// Définition des avatars par défaut
const DEFAULT_AVATARS = {
  user1: "https://api.dicebear.com/7.x/initials/svg?seed=JD&backgroundColor=52,53,65,255",
  user2: "https://api.dicebear.com/7.x/initials/svg?seed=AB&backgroundColor=52,53,65,255",
  user3: "https://api.dicebear.com/7.x/initials/svg?seed=CD&backgroundColor=52,53,65,255",
  user4: "https://api.dicebear.com/7.x/initials/svg?seed=EF&backgroundColor=52,53,65,255",
};
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=??&backgroundColor=52,53,65,255";

// Fonction pour obtenir l'avatar d'un utilisateur
const getAvatarForUser = (email) => {
  if (!email) return DEFAULT_AVATAR;
  const hash = email.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const avatarSet = Object.values(DEFAULT_AVATARS);
  const index = Math.abs(hash) % avatarSet.length;
  return avatarSet[index];
};

// Tableau de couleurs pour les icônes des membres
const MEMBER_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];

// Fonction pour attribuer une couleur à partir de l'email du membre
const getMemberIconColor = (email) => {
  if (!email) return "bg-gray-500";
  const hash = email.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const index = Math.abs(hash) % MEMBER_COLORS.length;
  return MEMBER_COLORS[index];
};

// Fonction utilitaire pour obtenir le nom à afficher d'un utilisateur
function getUserDisplayName(user) {
  if (!user) return "";
  return user.name || user.username || (user.email ? user.email.split("@")[0] : "");
}

export default function TeamDetails({ team, onBack, currentUser, newTask }) {
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
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  // État pour la boîte latérale des tâches complétées
  const [isCompletedPanelOpen, setIsCompletedPanelOpen] = useState(false);

  // Préfixe des tâches de l'équipe
  const teamPrefix = `${team.name} | `;

  const filterTeamTasks = (allTasks) =>
    allTasks.filter((task) => task.title && task.title.startsWith(teamPrefix));

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
      const teamTasks = filterTeamTasks(fetchedTasks);
      setTasks(teamTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      setError(error.message);
      showToast("error", t("errorLoadingTasks"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [newTask, sortBy, filterStatus, filterPriority, language]);

  // Filtrer la liste principale pour n'afficher que les tâches non complétées
  const filteredTasks = tasks.filter((task) => {
    if (task.status === "done") return false;
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  // Tâches complétées et répartition par utilisateur
  const completedTasks = tasks.filter((task) => task.status === "done");
  const completedTasksByUser = completedTasks.reduce((acc, task) => {
    const key = task.assignedTo?.email || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (sortBy === "priority") {
      const getPriorityOrder = (p) =>
        p === "high" ? 3 : p === "medium" ? 2 : p === "low" ? 1 : 0;
      return getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
    } else if (sortBy === "status") {
      const getStatusOrder = (s) =>
        s === "todo" ? 1 : s === "in_progress" ? 2 : s === "review" ? 3 : s === "done" ? 4 : 0;
      return getStatusOrder(a.status) - getStatusOrder(b.status);
    }
    return 0;
  });

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
    const newStatus = (() => {
      switch (currentStatus) {
        case "todo":
          return "in_progress";
        case "in_progress":
          return "review";
        case "review":
          return "done";
        default:
          return "todo";
      }
    })();
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

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "bg-red-100 text-red-600 border-red-200";
      case "in_progress":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "review":
        return "bg-yellow-100 text-yellow-600 border-yellow-200";
      case "done":
        return "bg-green-100 text-green-600 border-green-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-600 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "low":
        return "bg-green-100 text-green-600 border-green-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getCardBackground = (status) => {
    switch (status) {
      case "todo":
        return "bg-red-50 dark:bg-red-900 border border-red-100 dark:border-red-800 shadow-sm dark:shadow-md";
      case "in_progress":
        return "bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800 shadow-sm dark:shadow-md";
      case "review":
        return "bg-yellow-50 dark:bg-yellow-900 border border-yellow-100 dark:border-yellow-800 shadow-sm dark:shadow-md";
      case "done":
        return "bg-green-50 dark:bg-green-900 border border-green-100 dark:border-green-800 shadow-sm dark:shadow-md";
      default:
        return "bg-white dark:bg-[#323131] border border-gray-200 dark:border-[#323131] shadow-sm dark:shadow-md";
    }
  };

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
      }
    }
  };

  const handleTaskCreated = () => {
    setIsCreateTaskOpen(false);
    loadTasks();
  };

  return (
    <div className="space-y-6 relative">
      {/* En-tête avec bouton de retour et titre */}
      <div className="flex items-center gap-2 px-4 sm:px-6 pt-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{team.name}</h1>
      </div>

      {/* Section Membres de l'équipe avec icônes colorées */}
      <div className="px-4 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Membres de l'équipe</h2>
        <div className="flex items-center gap-4 mt-2">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => (
              <div key={member._id} className="flex flex-col items-center">
                <Avatar className="h-12 w-12 shadow-md">
                  <AvatarImage
                    src={member.avatar || getAvatarForUser(member.email)}
                    alt={member.name}
                  />
                  <AvatarFallback
                    className={`flex items-center justify-center ${getMemberIconColor(member.email)} text-white`}
                  >
                    {member.name ? member.name.charAt(0) : member.email ? member.email.charAt(0) : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="mt-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  {getUserDisplayName(member)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Aucun membre trouvé.</p>
          )}
        </div>
      </div>

      {/* Barre d'outils des tâches */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-white dark:bg-[#323131] border-b border-gray-200 dark:border-[#323131] px-4 sm:px-6 py-4 shadow-sm dark:shadow-md flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("teamTasks")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {sortedTasks.length} {t("tasks")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateTaskOpen(true)}
            variant="outline"
            size="sm"
            className="bg-[#b7b949] hover:bg-[#b7b949] text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("newTask")}
          </Button>
          <Button
            onClick={loadTasks}
            variant="outline"
            size="sm"
            className="bg-[#b7b949] hover:bg-[#b7b949] text-white shadow-sm"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm">{t("refresh")}</span>
          </Button>
          <Button
            onClick={() => setIsDeleteAllDialogOpen(true)}
            variant="destructive"
            size="sm"
            className="bg-[#b7b949] hover:bg-[#b7b949] text-white shadow-sm"
            disabled={tasks.length === 0 || loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span className="text-sm">{t("deleteAll")}</span>
          </Button>
          {/* Bouton "Task Completed" */}
          <Button
            onClick={() => setIsCompletedPanelOpen(true)}
            variant="outline"
            size="sm"
            className="bg-[#b7b949] hover:bg-[#b7b949] text-white shadow-sm flex items-center gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{t("completedTasks")}</span>
          </Button>
        </div>
      </motion.div>

      {/* Liste principale des tâches (sans les tâches complétées) */}
      <div className="pt-6">
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center p-4"
            >
              <Loader2 className="h-8 w-8 animate-spin" />
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-4 text-red-500"
            >
              {error}
              <Button variant="outline" className="ml-2" onClick={loadTasks}>
                {t("retry")}
              </Button>
            </motion.div>
          ) : sortedTasks.length > 0 ? (
            <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedTasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                  className={cn("relative overflow-hidden rounded-xl transition-all duration-300", getCardBackground(task.status))}
                >
                  <div className="relative p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 line-clamp-2">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {task.imageUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewImage(task)}
                            className="bg-gray-100 dark:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                          >
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-xs">{t("viewImage")}</span>
                          </Button>
                        )}
                        {task.attachments &&
                          Array.isArray(task.attachments) &&
                          task.attachments.some(
                            (att) =>
                              att.dataUrl &&
                              att.dataUrl.startsWith("data:application/pdf")
                          ) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPDF(task)}
                              className="bg-gray-100 dark:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="text-xs">{t("viewPDF")}</span>
                            </Button>
                          )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0">
                              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-48 bg-white dark:bg-[#323131] border border-gray-200 dark:border-[#323131] shadow-md rounded-lg">
                            <DropdownMenuItem
                              onClick={() => handleEditTask(task)}
                              className="text-sm text-gray-700 dark:text-gray-300"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t("edit")}
                            </DropdownMenuItem>
                            {task.status !== "done" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(task._id, task.status)}
                                className="text-sm text-gray-700 dark:text-gray-300"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t("advanceStatus")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task._id)}
                              className="text-sm text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {task.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                        {getStatusLabel(task.status)}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>{t("status")}:</span>
                        <span className="font-medium">{getStatusLabel(task.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("priority")}:</span>
                        <span className="font-medium">{getPriorityLabel(task.priority)}</span>
                      </div>
                      {task.deadline && (
                        <div className="flex justify-between">
                          <span>{t("deadline")}:</span>
                          <span className="font-medium text-red-500">
                            {format(new Date(task.deadline), "Pp", { locale: getLocale() })}
                          </span>
                        </div>
                      )}
                      {task.estimatedTime && (
                        <div className="flex justify-between">
                          <span>{t("estimatedTime")}:</span>
                          <span className="font-medium">
                            {task.estimatedTime}h {t("estimated")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={task.createdBy?.avatar || getAvatarForUser(task.createdBy?.email)}
                          alt={`${t("avatarOf")} ${task.createdBy?.email || t("user")}`}
                        />
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {task.createdBy?.email?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{task.createdBy?.email}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-8"
            >
              <p className="text-gray-500 dark:text-gray-400">{t("noTasksFound")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Boîte latérale pour les tâches complétées */}
      <AnimatePresence>
        {isCompletedPanelOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl p-4 z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {t("completedTasks")} ({completedTasks.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsCompletedPanelOpen(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            {/* Résumé par utilisateur */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold">{t("completedBy")}:</h4>
              {Object.entries(completedTasksByUser).map(([email, count]) => (
                <p key={email} className="text-xs text-gray-600 dark:text-gray-300">
                  {email}: {count} {t("tasks")}
                </p>
              ))}
            </div>
            {completedTasks.length === 0 ? (
              <p className="text-gray-500">{t("noCompletedTasks")}</p>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task, index) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
                    className={cn("relative overflow-hidden rounded-xl transition-all duration-300", getCardBackground(task.status))}
                  >
                    <div className="relative p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 line-clamp-2">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {task.imageUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewImage(task)}
                              className="bg-gray-100 dark:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                            >
                              <ImageIcon className="h-4 w-4" />
                              <span className="text-xs">{t("viewImage")}</span>
                            </Button>
                          )}
                          {task.attachments &&
                            Array.isArray(task.attachments) &&
                            task.attachments.some(
                              (att) =>
                                att.dataUrl &&
                                att.dataUrl.startsWith("data:application/pdf")
                            ) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPDF(task)}
                                className="bg-gray-100 dark:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs">{t("viewPDF")}</span>
                              </Button>
                            )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-0">
                                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 bg-white dark:bg-[#323131] border border-gray-200 dark:border-[#323131] shadow-md rounded-lg">
                              <DropdownMenuItem
                                onClick={() => handleEditTask(task)}
                                className="text-sm text-gray-700 dark:text-gray-300"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t("edit")}
                              </DropdownMenuItem>
                              {task.status !== "done" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(task._id, task.status)}
                                  className="text-sm text-gray-700 dark:text-gray-300"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {t("advanceStatus")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-sm text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>{t("status")}:</span>
                          <span className="font-medium">{getStatusLabel(task.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("priority")}:</span>
                          <span className="font-medium">{getPriorityLabel(task.priority)}</span>
                        </div>
                        {task.deadline && (
                          <div className="flex justify-between">
                            <span>{t("deadline")}:</span>
                            <span className="font-medium text-red-500">
                              {format(new Date(task.deadline), "Pp", { locale: getLocale() })}
                            </span>
                          </div>
                        )}
                        {task.estimatedTime && (
                          <div className="flex justify-between">
                            <span>{t("estimatedTime")}:</span>
                            <span className="font-medium">
                              {task.estimatedTime}h {t("estimated")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={task.createdBy?.avatar || getAvatarForUser(task.createdBy?.email)}
                            alt={`${t("avatarOf")} ${task.createdBy?.email || t("user")}`}
                          />
                          <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                            {task.createdBy?.email?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{task.createdBy?.email}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <TaskEditDialog
        task={selectedTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={handleTaskUpdated}
      />

      <AlertDialog
        open={isDeleteAllDialogOpen}
        onOpenChange={setIsDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAllTasks")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteAllTasksConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllTasks}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("createTask")}</DialogTitle>
          </DialogHeader>
          <CreateTaskModal
            open={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
            onSuccess={handleTaskCreated}
            team={team}
            currentUser={currentUser}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
