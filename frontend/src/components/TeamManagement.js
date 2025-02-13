"use client";

import { useState, useEffect } from "react";
import { fetchUserTeams, fetchTasks, deleteTeam } from "../utils/api"; // Import unique
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Building2,
  ChevronRight,
  Layout,
  MessageSquare,
  Plus,
  Search,
  Users,
  Edit,
  Clock,
  PieChart, // Remplacement de Target par PieChart
  CheckSquare,
  Trash2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import CreateTeamModal from "./CreateTeamModal";
import TeamDetails from "./TeamDetails";
import EditTeamModal from "./EditTeamModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TEAM_COLORS = [
  "from-blue-500/20 to-indigo-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-orange-500/20 to-red-500/20",
  "from-green-500/20 to-emerald-500/20",
  "from-yellow-500/20 to-orange-500/20",
  "from-pink-500/20 to-rose-500/20",
  "from-indigo-500/20 to-purple-500/20",
  "from-emerald-500/20 to-teal-500/20",
];

const getTeamAvatar = (name) => {
  const gradientClass = TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)];
  return {
    letter: name.charAt(0).toUpperCase(),
    gradient: gradientClass,
  };
};

const initializeTeamStats = (team, tasks) => {
  const teamPrefix = `${team.name} | `;
  const teamTasks = tasks.filter((task) => task.title && task.title.startsWith(teamPrefix));

  const totalTasks = teamTasks.length;
  const completedTasks = teamTasks.filter((task) => task.status === "done").length;
  const inProgressTasks = teamTasks.filter((task) => task.status === "in_progress").length;
  const reviewTasks = teamTasks.filter((task) => task.status === "review").length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
  const recentTasks = teamTasks.filter((task) => new Date(task.createdAt) > thirtyDaysAgo);
  const activityScore = Math.min(Math.round((recentTasks.length / 30) * 100), 100);

  const tasksWithDeadlines = teamTasks.filter((task) => task.deadline);
  const deadlinesMet = tasksWithDeadlines.filter(
    (task) =>
      task.status === "done" &&
      new Date(task.completedAt) <= new Date(task.deadline)
  ).length;
  const performanceScore =
    tasksWithDeadlines.length > 0
      ? Math.round((deadlinesMet / tasksWithDeadlines.length) * 100)
      : completionPercentage;

  return {
    ...team,
    avatar: getTeamAvatar(team.name),
    stats: {
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        review: reviewTasks,
      },
      members: team.members?.length || 0,
      completion: completionPercentage,
      activity: activityScore,
      performance: performanceScore,
    },
  };
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-card border border-border p-3">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TeamCard({ team, index, onViewDetails, onEdit, onDelete, t }) {
  return (
    <motion.div
      key={team._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="cursor-default"
    >
      <Card className={cn(
        "group relative overflow-hidden transition-all hover:shadow-md",
        "bg-card hover:bg-accent/5",
        "border-border hover:border-primary/20",
        "hover:scale-[1.01] hover:-translate-y-0.5"
      )}>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="relative pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={team.avatar?.url} alt={team.name} />
                <AvatarFallback className={cn("bg-gradient-to-br", team.avatar?.gradient)}>
                  {team.avatar?.letter}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base font-semibold">{team.name}</CardTitle>
                <CardDescription className="line-clamp-1 mt-0.5 text-xs">
                  {team.description || t("noDescription")}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(team);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(team._id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label={t("members")} value={team.stats.members} />
            <StatCard icon={Briefcase} label={t("tasks")} value={team.stats.tasks.total} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  {/* Remplacement de l'icône Target par PieChart */}
                  <PieChart className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{t("completion")}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Affichage du pourcentage et du nombre de tâches terminées */}
                <span className="text-xs font-medium">
                  {team.stats.completion}% ({team.stats.tasks.completed}/{team.stats.tasks.total})
                </span>
                <CheckSquare
                  className={cn(
                    "h-3.5 w-3.5",
                    team.stats.completion >= 80
                      ? "text-yellow-500"
                      : team.stats.completion >= 50
                      ? "text-blue-500"
                      : "text-muted-foreground"
                  )}
                />
              </div>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${team.stats.completion}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  "bg-gradient-to-r",
                  team.stats.completion >= 80
                    ? "from-green-500 to-emerald-500"
                    : team.stats.completion >= 50
                    ? "from-blue-500 to-indigo-500"
                    : "from-orange-500 to-red-500"
                )}
              />
            </div>
          </div>

          <div className="flex">
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(team);
              }}
            >
              {t("viewDetails")}
              <ChevronRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TeamManagement() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [view, setView] = useState("grid");
  const [teamToEdit, setTeamToEdit] = useState(null);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (user) {
      const loadTeams = async () => {
        setLoading(true);
        try {
          const [teamsData, tasksData] = await Promise.all([
            fetchUserTeams(user.id || user._id),
            fetchTasks(),
          ]);
          setTasks(tasksData);
          setTeams(teamsData.map((team) => initializeTeamStats(team, tasksData)));
        } catch (error) {
          toast({
            title: t("error"),
            description: t("errorLoadingTeams"),
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      loadTeams();
    }
  }, [user, toast, t]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fonction pour supprimer une équipe
  const handleDeleteTeam = async (teamId) => {
    try {
      await deleteTeam(teamId);
      setTeams((prevTeams) => prevTeams.filter((team) => team._id !== teamId));
      toast({
        title: t("success"),
        description: t("teamDeleted"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("errorDeletingTeam"),
        variant: "destructive",
      });
    }
  };

  const handleTeamCreated = (newTeam) => {
    const teamWithStats = initializeTeamStats(newTeam, tasks);
    setTeams((prevTeams) => [...prevTeams, teamWithStats]);
    setIsModalOpen(false);
    toast({
      title: t("success"),
      description: t("teamCreated"),
    });
  };

  const handleTeamUpdated = (updatedTeam) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team._id === updatedTeam._id
          ? initializeTeamStats(updatedTeam, tasks)
          : team
      )
    );
    setIsEditTeamModalOpen(false);
    toast({
      title: t("success"),
      description: t("teamUpdated"),
    });
  };

  if (selectedTeam) {
    return (
      <TeamDetails
        team={selectedTeam}
        onBack={() => setSelectedTeam(null)}
        currentUser={user}
        tasks={tasks}
        onDeleteTask={null} // Gestion de suppression de tâche dans TeamDetails si nécessaire
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-14 items-center px-4 gap-4">
          <h1 className="text-lg font-semibold">{t("spaces")}</h1>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90 h-8"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("createSpace")}
          </Button>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchSpaces")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Tabs value={view} onValueChange={setView} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="grid" className="h-7">
                <Layout className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="h-7">
                <MessageSquare className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-[200px] items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full bg-primary/20" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">{t("loadingSpaces")}</p>
              </div>
            </motion.div>
          ) : filteredTeams.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex h-[200px] items-center justify-center flex-col gap-4 text-center"
            >
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{searchQuery ? t("noSpacesFound") : t("noSpaces")}</p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">
                {t("createYourFirstSpace")}
              </Button>
            </motion.div>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team, index) => (
                <TeamCard
                  key={team._id}
                  team={team}
                  index={index}
                  onViewDetails={(team) => setSelectedTeam(team)}
                  onEdit={(team) => {
                    setTeamToEdit(team);
                    setIsEditTeamModalOpen(true);
                  }}
                  onDelete={handleDeleteTeam}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeams.map((team, index) => (
                <motion.div
                  key={team._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-md transition-all bg-card hover:bg-accent/5 border-border hover:border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={team.avatar?.url} alt={team.name} />
                          <AvatarFallback className={cn("bg-gradient-to-br", team.avatar?.gradient)}>
                            {team.avatar?.letter}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">{team.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {team.description || t("noDescription")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">{team.stats.members}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">{team.stats.tasks.total}</span>
                          </div>
                          <div className="w-24">
                            <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${team.stats.completion}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-full",
                                  "bg-gradient-to-r",
                                  team.stats.completion >= 80
                                    ? "from-green-500 to-emerald-500"
                                    : team.stats.completion >= 50
                                    ? "from-blue-500 to-indigo-500"
                                    : "from-orange-500 to-red-500"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTeam(team)}>
                          {t("viewDetails")}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      <CreateTeamModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTeamCreated={handleTeamCreated}
        currentUser={user}
      />

      {teamToEdit && (
        <EditTeamModal
          open={isEditTeamModalOpen}
          onClose={() => setIsEditTeamModalOpen(false)}
          team={teamToEdit}
          onTeamUpdated={handleTeamUpdated}
        />
      )}
    </div>
  );
}
