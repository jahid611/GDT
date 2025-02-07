// src/components/TeamManagement.js
"use client";

import { useState, useEffect } from "react";
import { fetchUserTeams, createTeamViaUserAPI as createTeam } from "../utils/api";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "../hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";

export default function TeamManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  // On utilise user._id (assurez-vous que votre objet user contient _id)
  const [leader, setLeader] = useState(user ? user._id : "");
  const [members, setMembers] = useState([]); // Vous pouvez étendre cette logique pour ajouter plusieurs membres
  const [showModal, setShowModal] = useState(false);

  const loadTeams = async () => {
    if (!user || !user._id) {
      console.warn("Utilisateur non défini, impossible de charger les équipes.");
      return;
    }
    try {
      setLoading(true);
      const teamsData = await fetchUserTeams(user._id);
      setTeams(teamsData);
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failedToLoadTeams"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      loadTeams();
    }
  }, [user]);

  const handleCreateTeam = async () => {
    if (!teamName) {
      toast({
        title: t("error"),
        description: t("teamNameRequired"),
        variant: "destructive",
      });
      return;
    }
    try {
      const newTeam = {
        name: teamName,
        description: teamDescription,
        leader: leader,
        // Par défaut, si aucun membre n'est précisé, on ajoute le leader
        members: (members && members.length > 0) ? members : [leader],
      };
      await createTeam(newTeam);
      toast({
        title: t("success"),
        description: t("teamCreated"),
        variant: "success",
      });
      setTeamName("");
      setTeamDescription("");
      setMembers([]);
      setShowModal(false);
      loadTeams();
    } catch (error) {
      toast({
        title: t("error"),
        description: error.message || t("failedToCreateTeam"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t("teamManagement")}</h1>
      <Button onClick={() => setShowModal(true)}>{t("createTeam")}</Button>
      {loading ? (
        <p>{t("loadingTeams")}...</p>
      ) : teams.length === 0 ? (
        <p>{t("noTeamsFound")}</p>
      ) : (
        <ul className="mt-4">
          {teams.map((team) => (
            <li key={team._id} className="border p-2 rounded mb-2">
              <h2 className="font-semibold">{team.name}</h2>
              <p>{team.description}</p>
              <p>
                {t("leader")}: {team.leader?.email || "N/A"}
              </p>
              <p>
                {t("members")}:{" "}
                {team.members && team.members.length > 0
                  ? team.members.map((m) => m.email).join(", ")
                  : t("none")}
              </p>
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-xl font-bold mb-4">{t("createTeam")}</h2>
            <div className="mb-4">
              <Label>{t("teamName")}</Label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            </div>
            <div className="mb-4">
              <Label>{t("teamDescription")}</Label>
              <Input value={teamDescription} onChange={(e) => setTeamDescription(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleCreateTeam}>{t("create")}</Button>
            </div>
          </div>
        </div>
      )}
      <Button onClick={loadTeams} className="mt-4">
        {t("refresh")}
      </Button>
    </div>
  );
}
