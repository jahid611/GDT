"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Filter,
  MoreVertical,
  Plus,
  Search,
  User,
  SortAsc,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useTranslation } from "../hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateTaskModal from "./CreateTaskModal";

const statusColors = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function TeamDetails({ team, onBack, currentUser }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("tasks");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // États pour les tâches et le chargement (identiques à tasklist)
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");

  // Fonction pour charger les tâches depuis l'API
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy: sortBy,
      });
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des tâches");
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, sortBy]);

  // Chargement des tâches au montage et lors du changement des filtres
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // On filtre ici les tâches pour n'afficher que celles dont le titre commence par le préfixe "NomDeLaTeam | "
  const teamPrefix = `${team.name} | `;
  const filteredTasks = tasks.filter(
    (task) => task.title && task.title.startsWith(teamPrefix)
  );

  // Handler appelé lors de la création ou mise à jour d'une tâche
  const handleTaskSuccess = useCallback(() => {
    setIsCreateTaskOpen(false);
    loadTasks();
  }, [loadTasks]);

  return (
    <div className="h-full flex">
      {/* Sidebar gauche */}
      <div className="w-64 border-r flex flex-col">
        <div className="h-16 border-b flex items-center px-4 gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className={`h-8 w-8 ${team.avatar.color}`}>
            <AvatarFallback>{team.avatar.letter}</AvatarFallback>
          </Avatar>
          <span className="font-semibold truncate">{team.name}</span>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="p-2">
            <TabsList className="w-full">
              <TabsTrigger value="tasks" className="flex-1">
                {t("tasks")}
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1">
                {t("members")}
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="flex-1">
            <TabsContent value="members" className="m-0">
              <div className="p-4 space-y-4">
                {team.members?.map((member) => (
                  <div
                    key={member.id || member._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.name || member.email}
                      </p>
                      {member.name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      )}
                    </div>
                    {(member.id || member._id) === (team.leader?.id || team.leader?._id) && (
                      <Badge variant="secondary" className="ml-auto">
                        {t("leader")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b flex items-center px-4 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchTasks")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t("filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="todo">{t("todo")}</SelectItem>
                <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                <SelectItem value="review">{t("review")}</SelectItem>
                <SelectItem value="done">{t("done")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">{t("dateCreated")}</SelectItem>
                <SelectItem value="dueDate">{t("dueDate")}</SelectItem>
                <SelectItem value="priority">{t("priority")}</SelectItem>
                <SelectItem value="status">{t("status")}</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setIsCreateTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("newTask")}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {error ? (
            <div className="text-center p-4 text-red-500">
              {error}
              <Button variant="outline" className="ml-2" onClick={loadTasks}>
                {t("retry")}
              </Button>
            </div>
          ) : loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <Card key={task._id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-medium truncate">{task.title}</h3>
                      <Badge className={statusColors[task.status]}>
                        {t(task.status)}
                      </Badge>
                      <Badge className={priorityColors[task.priority]}>
                        {t(task.priority)}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {task.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{task.estimatedTime}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {task.assignedTo && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignedTo.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>{t("edit")}</DropdownMenuItem>
                      <DropdownMenuItem>{t("assign")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              {searchQuery ? t("noTasksFound") : t("noTasks")}
            </div>
          )}
        </ScrollArea>

        <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("createTask")}</DialogTitle>
            </DialogHeader>
            <CreateTaskModal
              open={isCreateTaskOpen}
              onClose={() => setIsCreateTaskOpen(false)}
              onSuccess={handleTaskSuccess}
              team={team}
              currentUser={currentUser}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
