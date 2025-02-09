// src/components/TeamDetailsPage.js
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Timer, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "../hooks/useTranslation";
import { fetchTeamTasks } from "../utils/api";
import TeamTaskCreationModal from "./TeamTaskCreationModal";

export default function TeamDetailsPage({ team }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [openTaskModal, setOpenTaskModal] = useState(false);

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      const tasksData = await fetchTeamTasks(team._id);
      setTasks(tasksData);
    } catch (error) {
      toast(t("error"), error.message, "destructive");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (team && team._id) {
      loadTasks();
    }
  }, [team]);

  return (
    <div className="p-8 max-w-7xl mx-auto bg-[#fafbfc] dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">{team.description}</p>
        <div className="mt-4 flex items-center">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">{t("leader")}:</span>
          <span className="text-sm text-gray-800 dark:text-white">
            {team.leader?.name || team.leader?.email || "N/A"}
          </span>
        </div>
        <div className="mt-2 flex items-center">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">{t("members")}:</span>
          <div className="flex -space-x-2">
            {team.members?.map((member, idx) => (
              <Avatar key={idx} className="h-8 w-8 border-2 border-white dark:border-gray-800">
                <AvatarImage src={member.avatar || ""} alt={member.name || member.email} />
                <AvatarFallback className="bg-[#B7B949]/10 text-[#B7B949]">
                  {(member.name || member.email.split("@")[0]).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("teamTasks")}</h2>
        <Button
          onClick={() => setOpenTaskModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          {t("createTask")}
        </Button>
      </div>

      {loadingTasks ? (
        <p className="text-center text-gray-500 dark:text-gray-400">{t("loadingTasks")}...</p>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <CheckCircle2 className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t("noTasksFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <Card key={task._id} className="hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold">{task.title}</CardTitle>
                  <Badge className="bg-[#B7B949] text-white">{task.status}</Badge>
                </div>
                <CardDescription className="mt-2 text-gray-600 dark:text-gray-300">
                  {task.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-2 mt-4">
                {task.deadline && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(task.deadline), "PPP", { locale: fr })}
                  </div>
                )}
                {task.estimatedTime && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Timer className="h-4 w-4 mr-1" />
                    {task.estimatedTime}h
                  </div>
                )}
                {task.createdAt && (
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {t("createdOn")} {format(new Date(task.createdAt), "dd/MM/yyyy")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openTaskModal} onOpenChange={setOpenTaskModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("createTaskForTeam", { team: team.name })}</DialogTitle>
          </DialogHeader>
          <TeamTaskCreationModal
            team={team}
            onSuccess={() => {
              setOpenTaskModal(false);
              loadTasks();
            }}
            onCancel={() => setOpenTaskModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
