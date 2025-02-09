"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "@/components/ui/use-toast";
import { createTask } from "../utils/api"; // Fonction qui effectue le POST sur /api/tasks

const DEFAULT_PREFIX = "Maintenance | ";

const CreateTaskModal = ({ open, onClose, teamId, currentUser, onTaskCreated, mode = "create", initialData = null }) => {
  const { t } = useTranslation();
  
  // Pour le titre, on gère le préfixe maintenance si activé
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(true);
  const [titleSuffix, setTitleSuffix] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");

  // En mode édition, on remplit les champs avec les données existantes
  useEffect(() => {
    if (initialData) {
      if (initialData.title && initialData.title.startsWith(DEFAULT_PREFIX)) {
        setTitleSuffix(initialData.title.slice(DEFAULT_PREFIX.length));
      } else {
        setTitleSuffix(initialData.title || "");
      }
      setDescription(initialData.description || "");
      setStatus(initialData.status || "todo");
      setPriority(initialData.priority || "medium");
      setDeadline(initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : "");
      setEstimatedTime(initialData.estimatedTime || "");
      // Le champ assignedTo est omis, donc toujours null.
    }
  }, [initialData]);

  const handleCreateTask = async () => {
    if (!titleSuffix.trim() || !deadline) {
      toast({
        title: t("error"),
        description: t("taskTitleAndDeadlineRequired") || "Le titre et la deadline sont requis.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser || !(currentUser._id || currentUser.id)) {
      toast({
        title: t("error"),
        description: "Utilisateur non authentifié.",
        variant: "destructive",
      });
      return;
    }
    const userId = currentUser._id || currentUser.id;
    const finalTitle = maintenanceEnabled ? DEFAULT_PREFIX + titleSuffix.trim() : titleSuffix.trim();

    const newTask = {
      title: finalTitle,
      description: description.trim(),
      status,
      priority,
      deadline, // Format "YYYY-MM-DDTHH:mm"
      estimatedTime,
      assignedTo: null, // Toujours null
      createdBy: userId,
      teamId,
    };

    try {
      console.log("Creating task with data:", newTask);
      const created = await createTask(newTask);
      toast({
        title: t("success"),
        description: t("taskCreated") || "Tâche créée avec succès.",
        variant: "success",
      });
      onTaskCreated(created);
      // Réinitialiser les champs
      setTitleSuffix("");
      setDescription("");
      setDeadline("");
      setPriority("medium");
      setEstimatedTime("");
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création de la tâche :", error);
      toast({
        title: t("error"),
        description: error.message || t("failedToCreateTask") || "La création de la tâche a échoué.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white text-black p-6 rounded-md">
        <DialogHeader>
          <DialogTitle>{t("createTask") || "Créer une tâche"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Contrôle pour activer/désactiver le préfixe Maintenance */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{t("maintenanceMode")}</label>
            <input
              type="checkbox"
              checked={maintenanceEnabled}
              onChange={(e) => setMaintenanceEnabled(e.target.checked)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{t("title")}</label>
            <div className="flex gap-2">
              {maintenanceEnabled && (
                <Input
                  value={DEFAULT_PREFIX}
                  readOnly
                  className="w-40 bg-gray-100 border border-gray-300 text-gray-700 cursor-not-allowed"
                />
              )}
              <Input
                value={titleSuffix}
                onChange={(e) => setTitleSuffix(e.target.value)}
                required
                className="flex-1 bg-white border border-gray-300 text-gray-700"
                placeholder={t("enterTaskTitle")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{t("description")}</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-white border border-gray-300 text-gray-700"
              placeholder={t("enterTaskDescription")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t("deadline")}</label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t("estimatedTime")}</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700"
                placeholder={t("enterEstimatedTime")}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t("priority")}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-700"
              >
                <option value="low">{t("low") || "Faible"}</option>
                <option value="medium">{t("medium") || "Moyenne"}</option>
                <option value="high">{t("high") || "Élevée"}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t("status")}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-700"
              >
                <option value="todo">{t("todo")}</option>
                <option value="in_progress">{t("inProgress")}</option>
                <option value="review">{t("review")}</option>
                <option value="done">{t("done")}</option>
              </select>
            </div>
          </div>
          {/* Le champ AssignedTo est omis, il sera toujours null */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="px-4 py-2 border-gray-400 text-gray-700">
              {t("cancel") || "Annuler"}
            </Button>
            <Button onClick={handleCreateTask} className="px-4 py-2 bg-[#b7b949] hover:bg-[#a3a542] text-white">
              {t("create") || "Créer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
