"use client";

import { useState, useEffect } from "react";
import { fetchTeamTasks } from "../utils/api"; // Fonction API pour récupérer les tâches d'une équipe
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Clock, Timer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import TeamTaskCreationModal from "./TeamTaskCreationModal";

export default function TeamPage({ team }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Charge les tâches associées à l'équipe via l'API
  const loadTasks = async () => {
    if (!team?._id) return;
    try {
      setLoading(true);
      const teamTasks = await fetchTeamTasks(team._id);
      setTasks(teamTasks);
    } catch (error) {
      showToast({
        title: t("error"),
        description: error.message || t("failedToLoadTasks"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [team]);

  // Après création d'une tâche, on ferme le modal et on recharge les tâches
  const handleTaskCreated = () => {
    setShowTaskModal(false);
    showToast({
      title: t("success"),
      description: t("taskCreatedForTeam") || "Tâche créée avec succès pour l'équipe",
      variant: "success",
    });
    loadTasks();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Affichage des détails de l'équipe */}
      <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">{team.name}</h1>
      <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">{team.description}</p>

      {/* Bouton de création de tâche visible si l'utilisateur est leader ou membre */}
      {(team.leader._id === user.id || team.members.some((member) => member._id === user.id)) && (
        <Button
          onClick={() => setShowTaskModal(true)}
          className="mb-6 bg-[#B7B949] hover:bg-[#A3A542] text-white px-4 py-2 rounded shadow transition-colors"
        >
          {t("createTaskForTeam") || "Créer une tâche pour l'équipe"}
        </Button>
      )}

      {/* Affichage des tâches */}
      {loading ? (
        <p>{t("loadingTasks") || "Chargement des tâches..."}</p>
      ) : tasks.length === 0 ? (
        <p>{t("noTasksFound") || "Aucune tâche trouvée pour cette équipe."}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <Card key={task._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold">{task.title}</CardTitle>
                <CardDescription className="mt-1">{task.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {task.deadline && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(task.deadline), "PPP", { locale: fr })}
                  </div>
                )}
                {task.estimatedTime && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Timer className="h-4 w-4 mr-2" />
                    {task.estimatedTime}h
                  </div>
                )}
                {task.createdAt && (
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    Créée le {format(new Date(task.createdAt), "dd/MM/yyyy")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création de tâche d'équipe */}
      {showTaskModal && (
        <TeamTaskCreationModal
          teamId={team._id}
          onSuccess={handleTaskCreated}
          onCancel={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
}
