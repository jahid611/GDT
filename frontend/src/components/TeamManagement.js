// src/components/TeamManagement.js
"use client";

import { useState, useEffect, useRef } from "react";
import { fetchUserTeams, createTeamViaUserAPI as createTeam, getUsers } from "../utils/api";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "../hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
// Assurez-vous d'avoir créé/importé ce composant pour afficher les tâches de l'équipe
import TeamTasks from "./TeamTasks";

const getUsernameFromEmail = (email) => (email ? email.split("@")[0] : "");

export default function TeamManagement() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user } = useAuth();
  const userId = user ? (user.id || user._id) : "";
  const [leader, setLeader] = useState(userId);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  // Le leader est toujours inclus dans la liste des membres
  const [members, setMembers] = useState(userId ? [userId] : []);
  const [allUsers, setAllUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamTasksModal, setShowTeamTasksModal] = useState(false);

  // Chargement des équipes de l'utilisateur
  const loadTeams = async () => {
    if (!userId) {
      console.warn("Utilisateur non défini, impossible de charger les équipes.");
      return;
    }
    try {
      setLoading(true);
      const teamsData = await fetchUserTeams(userId);
      setTeams(teamsData);
    } catch (error) {
      showToast({
        title: t("error"),
        description: t("failedToLoadTeams"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Chargement de tous les utilisateurs pour la sélection des membres
  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setAllUsers(usersData);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      showToast({
        title: t("error"),
        description: t("failedToLoadUsers") || "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user && (user.id || user._id)) {
      loadTeams();
      loadUsers();
    }
  }, [user]);

  // Lors du clic sur une équipe, on ouvre un modal avec l'interface des tâches de l'équipe
  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    setShowTeamTasksModal(true);
  };

  // Lors de la création d'une équipe, le leader est toujours inclus dans les membres
  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      showToast({
        title: t("error"),
        description: t("teamNameRequired"),
        variant: "destructive",
      });
      return;
    }
    try {
      const updatedMembers = Array.from(new Set([...members, leader]));
      const newTeam = {
        name: teamName.trim(),
        description: teamDescription.trim(),
        leader: leader,
        members: updatedMembers,
      };
      await createTeam(leader, newTeam);
      showToast({
        title: t("success"),
        description: t("teamCreated"),
        variant: "success",
      });
      setTeamName("");
      setTeamDescription("");
      setMembers([leader]); // Réinitialise les membres pour qu'ils contiennent uniquement le leader
      setShowModal(false);
      loadTeams();
    } catch (error) {
      showToast({
        title: t("error"),
        description: error.message || t("failedToCreateTeam"),
        variant: "destructive",
      });
    }
  };

  // Permet de basculer la sélection d'un membre
  const handleToggleMember = (memberId) => {
    if (memberId === leader) return; // Le leader est toujours sélectionné
    if (members.includes(memberId)) {
      setMembers(members.filter((id) => id !== memberId));
    } else {
      setMembers([...members, memberId]);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t("teamManagement")}</h1>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#b7b949] hover:bg-[#a3a542] text-white shadow-lg transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("createTeam")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b7b949]"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Users className="h-12 w-12 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">{t("noTeamsFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team._id}
              onClick={() => handleTeamClick(team)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-transform duration-200 cursor-pointer border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#b7b949]/10 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-[#b7b949]" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{team.name}</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{team.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("leader")}:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {team.leader?.name || team.leader?.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {team.members?.map((member) => (
                      <Avatar key={member._id} className="h-8 w-8 border-2 border-white dark:border-gray-800">
                        <AvatarImage src={member.avatar} alt={member.name || member.email} />
                        <AvatarFallback className="bg-[#b7b949]/10 text-[#b7b949]">
                          {(member.name || member.email.split("@")[0]).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création de nouvelle équipe */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("createTeam")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamName" className="block text-gray-700 dark:text-gray-200">{t("teamName")}</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={t("enterTeamName")}
                className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#b7b949]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamDescription" className="block text-gray-700 dark:text-gray-200">{t("teamDescription")}</Label>
              <Input
                id="teamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder={t("enterTeamDescription")}
                className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#b7b949]"
              />
            </div>
            <div className="space-y-2">
              <Label className="block text-gray-700 dark:text-gray-200 mb-1">{t("selectMembers")}</Label>
              <ScrollArea className="h-[200px] rounded-md border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allUsers.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => handleToggleMember(u._id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        members.includes(u._id)
                          ? "bg-[#b7b949]/10 border-[#b7b949] border"
                          : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#b7b949]"
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar || ""} alt={u.name || u.email} />
                        <AvatarFallback className="bg-[#b7b949]/10 text-[#b7b949]">
                          {(u.name || u.email.split("@")[0]).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate">
                          {u.name || u.email.split("@")[0]}
                        </span>
                        {u._id === leader && <span className="text-xs text-[#b7b949]">{t("leader")}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="px-4 py-2 border-gray-400 text-gray-700 dark:text-gray-300">
                {t("cancel")}
              </Button>
              <Button onClick={handleCreateTeam} className="px-4 py-2 bg-[#b7b949] hover:bg-[#a3a542] text-white">
                {t("create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'affichage des tâches de l'équipe */}
      <Dialog open={showTeamTasksModal} onOpenChange={setShowTeamTasksModal}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t("teamDetails")}: {selectedTeam?.name}</DialogTitle>
          </DialogHeader>
          {selectedTeam && <TeamTasks team={selectedTeam} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getUserDisplayName(user) {
  if (!user) return "";
  return user.name || user.username || user.email.split("@")[0];
}
