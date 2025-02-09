"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  isSameDay,
  addDays,
  startOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  getHours,
  getMinutes,
  setHours,
  parseISO,
  isValid,
  isWithinInterval,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "../hooks/useTranslation";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Share2, Printer } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import CreateTaskModal from "./CreateTaskModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Constantes pour la grille horaire
const HOUR_HEIGHT = 80;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;

// Styles pour les statuts
const STATUS_STYLES = {
  todo: {
    color: "bg-red-500/90 hover:bg-red-500",
    text: "text-red-50",
  },
  in_progress: {
    color: "bg-blue-500/90 hover:bg-blue-500",
    text: "text-blue-50",
  },
  review: {
    color: "bg-yellow-500/90 hover:bg-yellow-500",
    text: "text-yellow-50",
  },
  done: {
    color: "bg-green-500/90 hover:bg-green-500",
    text: "text-green-50",
  },
};

// Retourne la position verticale d'une tâche à partir de sa deadline
function getTaskPosition(deadline) {
  const taskDate = parseISO(deadline);
  if (!isValid(taskDate)) return { top: 0, height: HOUR_HEIGHT };
  const hours = getHours(taskDate) - 8;
  const minutes = getMinutes(taskDate);
  const top = hours * HOUR_HEIGHT + minutes * MINUTE_HEIGHT;
  return { top, height: HOUR_HEIGHT };
}

// Empile verticalement les tâches dans une cellule pour éviter les superpositions
function computeStackedLayout(dayTasks, getTaskPosition) {
  const sorted = [...dayTasks].sort(
    (a, b) => getTaskPosition(a.deadline).top - getTaskPosition(b.deadline).top
  );
  let lastBottom = -Infinity;
  const margin = 5;
  return sorted.map((task) => {
    const computed = getTaskPosition(task.deadline).top;
    const newTop = computed < lastBottom ? lastBottom + margin : computed;
    lastBottom = newTop + HOUR_HEIGHT;
    return { task, top: newTop, height: HOUR_HEIGHT };
  });
}

// Composant pour afficher la fiche complète d'une tâche dans un modal (lecture seule)
const TaskViewModal = ({ task, open, onClose }) => {
  if (!task) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white text-black p-4 rounded-md">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm">
          <p>
            <strong>Deadline :</strong> {format(parseISO(task.deadline), "PPP p")}
          </p>
          <p>
            <strong>Créé par :</strong> {task.createdBy?.name || task.createdBy?.email || "Unknown"}
          </p>
          <p>
            <strong>Assigné à :</strong> {task.assignedTo?.name || task.assignedTo?.email || "Unassigned"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Composant MiniCalendar pour naviguer dans la semaine
const MiniCalendar = ({ selectedDate, onSelect, currentMonth, setCurrentMonth, tasks }) => {
  const dateLocale = fr;
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekDay = (monthStart.getDay() + 6) % 7;
  const totalSlots = startWeekDay + daysInMonth.length;
  const slots = [];
  for (let i = 0; i < totalSlots; i++) {
    slots.push(i < startWeekDay ? null : daysInMonth[i - startWeekDay]);
  }
  const weekRows = [];
  for (let i = 0; i < slots.length; i += 7) {
    weekRows.push(slots.slice(i, i + 7));
  }
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  return (
    <div className="p-4 bg-[#252525] rounded-md border border-white">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4 text-white" />
        </Button>
        <div className="text-center text-white font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4 text-white" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
          <div key={day} className="text-center text-xs text-white">
            {day}
          </div>
        ))}
      </div>
      {weekRows.map((week, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-7 gap-1 mt-1">
          {week.map((day, colIndex) => {
            if (!day) return <div key={colIndex} className="py-1"></div>;
            const hasTasks = tasks?.some((task) => {
              if (!task.deadline) return false;
              return isSameDay(parseISO(task.deadline), day);
            });
            return (
              <button
                key={colIndex}
                onClick={() => onSelect(day)}
                className={`py-1 w-full rounded ${
                  isSameDay(day, selectedDate)
                    ? "bg-[#2F7FE6] text-white"
                    : hasTasks
                    ? "bg-green-500/20 text-white hover:bg-green-500/30"
                    : "bg-transparent text-white hover:bg-gray-700"
                }`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Composant principal TeamTasks qui affiche les tâches d'une équipe et permet de créer une nouvelle tâche
export default function TeamTasks({ team }) {
  const { t } = useTranslation();
  const { user } = useAuth(); // Récupère l'utilisateur courant
  const [date, setDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [teamTasks, setTeamTasks] = useState(team.tasks || []);
  const [selectedTask, setSelectedTask] = useState(null);

  // Calcul de la semaine en cours (lundi à dimanche)
  const weekDays = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [date]);

  // Regroupement des tâches par jour
  const tasksByDay = useMemo(() => {
    return weekDays.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayTasks = teamTasks.filter((task) => {
        const taskDate = parseISO(task.deadline);
        return isWithinInterval(taskDate, { start: dayStart, end: dayEnd });
      });
      return { date: day, tasks: dayTasks };
    });
  }, [weekDays, teamTasks]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tâches de l'équipe {team.name}</h2>
      <div className="mb-4 flex items-center justify-between">
        <Input
          placeholder="Rechercher une tâche..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-1/2"
        />
        <Button onClick={() => setShowCreateTaskModal(true)} className="bg-[#b7b949] hover:bg-[#a3a542] text-white">
          Créer une tâche
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const { tasks } = tasksByDay[index] || { tasks: [] };
          const stackedTasks = computeStackedLayout(tasks, getTaskPosition);
          return (
            <div
              key={day.toISOString()}
              className="border border-white rounded p-2 relative"
              style={{ minHeight: HOUR_HEIGHT * 13 }}
            >
              <div className="sticky top-0 bg-[#252525] text-white px-2 py-1">
                {format(day, "EEE d MMM", { locale: fr })}
              </div>
              <div className="relative">
                {stackedTasks.length > 0 ? (
                  stackedTasks.map(({ task, top, height }) => {
                    const style = STATUS_STYLES[task.status];
                    return (
                      <div
                        key={task._id}
                        className={cn("absolute left-0 right-0 p-2 rounded-md cursor-pointer shadow-sm hover:shadow-lg", style.color, style.text)}
                        style={{ top: `${top}px`, height: `${height}px`, zIndex: 2 }}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="font-semibold text-sm truncate">{task.title}</div>
                        <div className="text-xs">{format(parseISO(task.deadline), "h:mm a")}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-sm text-gray-500">Aucune tâche</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={() => setDate(addDays(date, -7))}>Semaine précédente</Button>
        <Button onClick={() => setDate(addDays(date, 7))}>Semaine suivante</Button>
      </div>

      {/* Modal de création d'une nouvelle tâche */}
      <CreateTaskModal
        open={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        teamId={team._id}
        currentUser={user}
        onTaskCreated={(newTask) => setTeamTasks([...teamTasks, newTask])}
      />

      {/* Modal de visualisation de la tâche */}
      <TaskViewModal
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}

function getUserDisplayName(user) {
  if (!user) return "";
  return user.name || user.username || user.email.split("@")[0];
}
