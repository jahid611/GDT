    "use client";

    import React, { useState, useEffect, useMemo, useCallback } from "react";
    import { fetchTasks, updateTask } from "../utils/api";
    import {
      RefreshCw,
      Clock,
      Edit,
      CheckCircle2,
      AlertTriangle,
      Eye,
      ChevronLeft,
      ChevronRight,
      Share2,
      Printer,
      Search,
    } from "lucide-react";
    import {
      format,
      isSameDay,
      addDays,
      subDays,
      isWithinInterval,
      startOfWeek,
      startOfDay,
      endOfDay,
      eachDayOfInterval,
      addWeeks,
      subWeeks,
      getHours,
      getMinutes,
      setHours,
      parseISO,
      isValid,
    } from "date-fns";
    import { fr, enUS, ro } from "date-fns/locale";
    import { Calendar } from "@/components/ui/calendar";
    import { Button } from "@/components/ui/button";
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { useTranslation } from "../hooks/useTranslation";
    import { Badge } from "@/components/ui/badge";
    import { Input } from "@/components/ui/input";
    import { toast } from "@/components/ui/use-toast";
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuTrigger,
      DropdownMenuSeparator,
    } from "@/components/ui/dropdown-menu";
    import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
    import TaskEditDialog from "./TaskEditDialog";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { cn } from "@/lib/utils";

    // Configuration et constantes
    const locales = { fr, en: enUS, ro };
    const AUTO_REFRESH_INTERVAL = 30000; // 30 secondes
    // Plage horaire : de 8h à 20h
    const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
    const MINUTES_IN_HOUR = 60;
    const HOUR_HEIGHT = 80; // hauteur en pixels par heure
    const MINUTE_HEIGHT = HOUR_HEIGHT / MINUTES_IN_HOUR;

    // Styles pour les statuts
    const STATUS_STYLES = {
      todo: {
        color: "bg-red-500/90 hover:bg-red-500",
        border: "border-red-400",
        text: "text-red-50",
        icon: AlertTriangle,
        label: "À faire",
      },
      in_progress: {
        color: "bg-blue-500/90 hover:bg-blue-500",
        border: "border-blue-400",
        text: "text-blue-50",
        icon: Clock,
        label: "En cours",
      },
      review: {
        color: "bg-yellow-500/90 hover:bg-yellow-500",
        border: "border-yellow-400",
        text: "text-yellow-50",
        icon: Eye,
        label: "En révision",
      },
      done: {
        color: "bg-green-500/90 hover:bg-green-500",
        border: "border-green-400",
        text: "text-green-50",
        icon: CheckCircle2,
        label: "Terminé",
      },
    };

    // ----- Composant PreviewModal -----
    const PreviewModal = ({ previewImage, isOpen, setIsOpen }) => {
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] overflow-auto p-4">
            <DialogHeader>
              <DialogTitle className="text-white">Prévisualisation</DialogTitle>
            </DialogHeader>
            {previewImage && previewImage.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={previewImage}
                className="w-full h-[70vh]"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      );
    };

    // ----- Composant MiniCalendar -----
    const MiniCalendar = ({ selectedDate, onSelect, currentMonth, setCurrentMonth, tasks }) => {
      const dateLocale = locales.fr; // ou adaptez selon la langue
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const startWeekDay = (monthStart.getDay() + 6) % 7; // lundi = 0
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
                // Indicateur simple : fond vert si des tâches existent ce jour
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

    // ----- Composant principal TaskCalendar -----
    export default function TaskCalendar() {
      const { t, language } = useTranslation();
      const [tasks, setTasks] = useState([]);
      const [loading, setLoading] = useState(true);
      const [date, setDate] = useState(new Date());
      const [currentMonth, setCurrentMonth] = useState(new Date());
      const [selectedTask, setSelectedTask] = useState(null);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [searchQuery, setSearchQuery] = useState("");
      const [filterStatus, setFilterStatus] = useState("all");
      const [lastUpdate, setLastUpdate] = useState(new Date());
      const [previewImage, setPreviewImage] = useState(null);
      const [isPreviewOpen, setIsPreviewOpen] = useState(false);

      const dateLocale = locales[language] || enUS;

      // Fonction de chargement des tâches
      const loadTasks = useCallback(async () => {
        try {
          setLoading(true);
          const tasksData = await fetchTasks();
          setTasks(tasksData);
          setLastUpdate(new Date());
        } catch (error) {
          console.error("Failed to load tasks:", error);
          toast({
            title: t("error"),
            description: t("failedToLoadTasks"),
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }, [t]);

      useEffect(() => {
        const interval = setInterval(() => {
          loadTasks();
        }, AUTO_REFRESH_INTERVAL);
        return () => clearInterval(interval);
      }, [loadTasks]);

      useEffect(() => {
        loadTasks();
      }, [loadTasks]);

      // Calcul des jours de la semaine pour la vue semaine
      const weekDays = useMemo(() => {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = addDays(start, 6);
        if (!isValid(start) || !isValid(end)) return [];
        try {
          return eachDayOfInterval({ start, end });
        } catch (error) {
          console.error("Error calculating week days:", error);
          return [];
        }
      }, [date]);

      // Regroupement des tâches par jour
      const tasksByDay = useMemo(() => {
        if (!weekDays.length) return [];
        return weekDays.map((day) => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayTasks = tasks.filter((task) => {
            if (!task.deadline) return false;
            const taskDate = parseISO(task.deadline);
            if (!isValid(taskDate)) return false;
            if (filterStatus !== "all" && task.status !== filterStatus) return false;
            if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()))
              return false;
            return isWithinInterval(taskDate, { start: dayStart, end: dayEnd });
          });
          return {
            date: day,
            tasks: dayTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
          };
        });
      }, [tasks, weekDays, filterStatus, searchQuery]);

      // Calcul de la position verticale d'une tâche (à partir de 8h)
      const getTaskPosition = (deadline) => {
        const taskDate = parseISO(deadline);
        if (!isValid(taskDate)) return { top: 0, height: HOUR_HEIGHT };
        const hours = getHours(taskDate) - 8;
        const minutes = getMinutes(taskDate);
        const top = hours * HOUR_HEIGHT + minutes * MINUTE_HEIGHT;
        return { top, height: HOUR_HEIGHT };
      };

      const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsEditDialogOpen(true);
      };

      const handleDateChange = (amount) => {
        setDate(amount > 0 ? addDays(date, amount) : subDays(date, -amount));
      };

      const handleStatusChange = async (taskId, newStatus) => {
        try {
          const updatedTask = await updateTask(taskId, { status: newStatus });
          setTasks((prevTasks) =>
            prevTasks.map((task) => (task._id === taskId ? updatedTask : task))
          );
          toast({
            title: t("success"),
            description: t("statusUpdated"),
          });
        } catch (error) {
          console.error("Failed to update task status:", error);
          toast({
            title: t("error"),
            description: t("failedToUpdateStatus"),
            variant: "destructive",
          });
        }
      };

      const handleShare = () => {
        if (navigator.share) {
          navigator
            .share({
              title: "Mon Calendrier de Tâches",
              text: "Découvrez mon calendrier de tâches.",
              url: window.location.href,
            })
            .catch((error) => console.error("Share failed:", error));
        } else {
          toast({
            title: t("error"),
            description: t("shareNotSupported"),
            variant: "destructive",
          });
        }
      };

      const handlePrint = () => {
        window.print();
      };

      const handleViewImage = (task) => {
        if (task.imageUrl) {
          window.open(task.imageUrl, "_blank");
        }
      };

      return (
        <>
          {/* Modal de prévisualisation */}
          <PreviewModal
            previewImage={previewImage}
            isOpen={isPreviewOpen}
            setIsOpen={setIsPreviewOpen}
          />

          {/* Barre de commandes en haut (fond sombre d'origine) */}
          <div className="flex justify-end p-2 bg-[#252525] border-b border-white">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4 text-white" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4 text-white" />
            </Button>
          </div>

          <div className="flex flex-col h-screen">
            {/* Conteneur principal du calendrier avec fond #B7B949, texte en blanc, border-radius et marge */}
            <div className="flex flex-1 overflow-hidden bg-[#B7B949] text-white rounded-xl border border-white m-4">
              {/* Sidebar : MiniCalendrier, barre de recherche et filtres (fond sombre d'origine) */}
              <div className="w-64 border-r border-white flex flex-col gap-4 p-4">
                <MiniCalendar
                  selectedDate={date}
                  onSelect={setDate}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  tasks={tasks}
                />
                <div>
                  <Input
                    placeholder={t("search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#252525] border border-white text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between gap-2 rounded-md border border-white px-2 py-1"
                    onClick={() => setFilterStatus("all")}
                  >
                    <span>{t("allTasks")}</span>
                    <Badge variant="secondary" className="ml-2">
                      {tasks.length}
                    </Badge>
                  </Button>
                  {Object.entries(STATUS_STYLES).map(([statusKey, styleObj]) => {
                    const Icon = styleObj.icon;
                    const count = tasks.filter((t) => t.status === statusKey).length;
                    return (
                      <Button
                        key={statusKey}
                        variant="outline"
                        className={cn(
                          "w-full justify-between gap-2 rounded-md border border-white px-2 py-1",
                          filterStatus === statusKey && "bg-white/20"
                        )}
                        onClick={() => setFilterStatus(statusKey)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-white" />
                          <span>{styleObj.label}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Zone principale du calendrier */}
              <div className="flex-1 flex flex-col overflow-auto">
                {/* En-tête des dates avec fond sombre pour le contraste */}
                <div
                  className="sticky top-0 z-20 bg-[#252525] border-b border-white px-16 py-2 text-white"
                  style={{ minHeight: "4rem" }}
                >
                  <div className="grid grid-cols-7">
                    {weekDays.map((day) => (
                      <div
                        key={day.toISOString()}
                        className="flex flex-col items-center justify-center border-r border-white h-16"
                      >
                        <div className="text-sm font-medium text-white drop-shadow-sm">
                          {format(day, "EEE", { locale: dateLocale })}
                        </div>
                        <div className="text-xl text-white drop-shadow-sm">{format(day, "d")}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grille du calendrier */}
                <div className="flex-1 overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr] min-h-full">
                    {/* Colonne des heures (fond sombre pour le contraste) */}
                    <div className="w-16 border-r border-white bg-[#252525] sticky left-0 z-10">
                      {HOURS.map((hour) => (
                        <div key={hour} className="h-20 border-b border-white px-2 py-1">
                          <span className="text-xs text-white drop-shadow-sm">
                            {format(setHours(date, hour), "ha")}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Grille des tâches */}
                    <div className="relative">
                      <ScrollArea className="h-full">
                        <div
                          className="relative grid"
                          style={{ gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }}
                        >
                          {weekDays.map((day, dayIndex) => (
                            <div
                              key={day.toISOString()}
                              className={cn(
                                "relative border-r border-white",
                                isSameDay(day, date) && "bg-[#2F7FE6]/5"
                              )}
                            >
                              {HOURS.map((hour) => (
                                <div key={hour} className="h-20 border-b border-white relative">
                                  <div className="absolute top-1/2 left-0 right-0 border-t border-dotted border-white" />
                                </div>
                              ))}
                              {tasksByDay[dayIndex]?.tasks.map((task) => {
                                const { top, height } = getTaskPosition(task.deadline);
                                const style = STATUS_STYLES[task.status];
                                return (
                                  <div
                                    key={task._id}
                                    className={cn(
                                      "absolute left-1 right-1 p-4 rounded-xl cursor-pointer transition-transform transform hover:scale-105 hover:shadow-2xl group border border-white/20 bg-opacity-90",
                                      style.color,
                                      style.text
                                    )}
                                    style={{ top: `${top}px`, minHeight: `${height}px`, zIndex: 1 }}
                                    onClick={() => handleTaskClick(task)}
                                  >
                                    <div className="font-semibold text-lg break-words drop-shadow-sm">{task.title}</div>
                                    <div className="text-xs opacity-90 break-words flex items-center gap-1 mt-2 drop-shadow-sm">
                                      <Clock className="h-3 w-3" />
                                      {format(parseISO(task.deadline), "h:mm a")}
                                    </div>
                                    <div className="text-[10px] mt-2 break-words drop-shadow-sm">
                                      <span className="font-semibold">{t("createdBy")}: </span>
                                      {task.createdBy?.name || task.createdBy?.email || "Unknown"}
                                    </div>
                                    <div className="text-[10px] mt-1 break-words drop-shadow-sm">
                                      <span className="font-semibold">{t("assignedTo")}: </span>
                                      {task.assignedTo?.name || task.assignedTo?.email || t("unassigned")}
                                    </div>
                                    {task.status === "review" && task.imageUrl && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewImage(task);
                                        }}
                                        title={t("viewImage")}
                                        className="absolute bottom-2 right-2 bg-white/20 hover:bg-white/40"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-white/20"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTaskClick(task);
                                            }}
                                          >
                                            {t("edit")}
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          {Object.entries(STATUS_STYLES).map(([statusKey, styleObj]) => {
                                            const Icon = styleObj.icon;
                                            return (
                                              <DropdownMenuItem
                                                key={statusKey}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleStatusChange(task._id, statusKey);
                                                }}
                                                className={task.status === statusKey ? "bg-muted" : ""}
                                              >
                                                <Icon className="mr-2 h-4 w-4" />
                                                {styleObj.label}
                                              </DropdownMenuItem>
                                            );
                                          })}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                );
                              })}
                              {isSameDay(day, new Date()) && (
                                <div
                                  className="absolute left-0 right-0 border-t-2 border-transparent z-10"
                                  style={{
                                    top: `${(getHours(new Date()) - 8) * HOUR_HEIGHT + getMinutes(new Date()) * MINUTE_HEIGHT}px`,
                                  }}
                                >
                                  <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-[#2F7FE6]" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <TaskEditDialog
            task={selectedTask}
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setSelectedTask(null);
                loadTasks();
              }
            }}
            onTaskUpdated={(updatedTask) => {
              setTasks(tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)));
              setIsEditDialogOpen(false);
              toast({
                title: t("success"),
                description: t("taskUpdated"),
              });
            }}
          />
        </>
      );
    }
