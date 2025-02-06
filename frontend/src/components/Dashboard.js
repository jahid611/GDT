"use client";

import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Joyride, { EVENTS, STATUS } from "react-joyride";
import { useAuth } from "../contexts/AuthContext";
import TaskList from "./TaskList";
import TaskListMaintenance from "./TaskListMaintenance";
import TaskStats from "./TaskStats";
import TaskCalendar from "./TaskCalendar";
import TaskKanban from "./TaskKanban";
import UserProfile from "./UserProfile";
import AdminPanel from "./AdminPanel";
import { useNotifications } from "../contexts/NotificationContext";
import { useTranslation } from "../hooks/useTranslation";

import {
  Search,
  Settings,
  Sun,
  Moon,
  Calendar,
  ListTodo,
  LayoutGrid,
  BarChart2,
  User,
  LogOut,
  Bell,
  Plus,
  Shield,
  Wrench,
  Menu,
  Filter,
  ChevronDown,
  HelpCircle,
  MousePointer,
  Globe,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { ScrollArea } from "../components/ui/scroll-area";
import NotificationPanel from "./NotificationPanel";
import NotificationPopup from "./NotificationPopup";
import TaskCreationDialog from "./TaskCreationDialog";
import { cn } from "../lib/utils";

// Insertion du style global pour l'animation heartbeat
const globalStyles = `
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  .heartbeat {
    animation: heartbeat 1.5s infinite;
  }
`;
if (typeof window !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = globalStyles;
  document.head.appendChild(styleTag);
}

// Utilisez l'URL du logo fourni
const logoSrc =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-A4oA2peQSsUbnjIvgkqspXDTemvaV5.png";

// Fonction utilitaire pour extraire le nom d'utilisateur depuis l'email
// (la partie avant "@" avec les points remplacés par des espaces)
const getUsernameFromEmail = (email) => {
  if (!email) return "";
  const prefix = email.split("@")[0];
  return prefix.replace(/\./g, " ");
};

export default function Dashboard() {
  // États pour le mode dark/light, sidebar, etc.
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedView, setSelectedView] = useState("list");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // États pour le tutoriel avec Joyride
  const [runTour, setRunTour] = useState(false);
  const [currentTutorialTarget, setCurrentTutorialTarget] = useState(null);
  const tourSteps = [
    {
      target: "#menu-list",
      content: (
        <div className="flex items-center">
          <ListTodo className="h-5 w-5 mr-2" />
          <span>
            Le menu <strong>Liste</strong> affiche toutes vos tâches. Vous pouvez y consulter, modifier ou supprimer chaque tâche.
          </span>
        </div>
      ),
    },
    {
      target: "#menu-kanban",
      content: (
        <div className="flex items-center">
          <LayoutGrid className="h-5 w-5 mr-2" />
          <span>
            Le mode <strong>Kanban</strong> organise vos tâches en colonnes pour un suivi visuel.
          </span>
        </div>
      ),
    },
    {
      target: "#menu-calendar",
      content: (
        <div className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          <span>
            Dans le menu <strong>Calendrier</strong>, vous pouvez planifier et visualiser les échéances.
          </span>
        </div>
      ),
    },
    {
      target: "#menu-stats",
      content: (
        <div className="flex items-center">
          <BarChart2 className="h-5 w-5 mr-2" />
          <span>
            Le menu <strong>Statistiques</strong> présente un aperçu de vos performances et de votre productivité.
          </span>
        </div>
      ),
    },
    {
      target: "#menu-maintenance",
      content: (
        <div className="flex items-center">
          <Wrench className="h-5 w-5 mr-2" />
          <span>
            Accédez aux <strong>tâches de maintenance</strong> pour surveiller et assurer le bon fonctionnement.
          </span>
        </div>
      ),
    },
    {
      target: "#menu-profile",
      content: (
        <div className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          <span>
            Dans le menu <strong>Profil</strong>, gérez vos informations personnelles et paramètres.
          </span>
        </div>
      ),
    },
    {
      target: "#menu-admin",
      content: (
        <div className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          <span>
            Le menu <strong>Administration</strong> est réservé aux administrateurs pour gérer l'ensemble de l'application.
          </span>
        </div>
      ),
    },
    {
      target: "#theme-toggle",
      content: (
        <div className="flex items-center">
          {isDarkMode ? (
            <Sun className="h-5 w-5 mr-2" />
          ) : (
            <Moon className="h-5 w-5 mr-2" />
          )}
          <span>
            Utilisez ce bouton pour basculer entre le mode sombre et le mode clair.
          </span>
        </div>
      ),
    },
    {
      target: "#translate-button",
      content: (
        <div className="flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          <span>
            Cliquez ici pour changer la langue de l'application.
          </span>
        </div>
      ),
    },
    {
      target: "#new-task-button",
      content: (
        <div className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          <span>
            Cliquez ici pour créer une <strong>Nouvelle tâche</strong> et ouvrir le formulaire de création.
          </span>
        </div>
      ),
    },
    {
      target: "#header-restart-tour",
      content: (
        <div className="flex flex-col items-center">
          <img src={logoSrc} alt="Logo" className="h-12 w-auto mb-2" />
          <div className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            <span>
              Ce bouton vous permet de relancer le tutoriel pour revoir les fonctionnalités.
            </span>
          </div>
        </div>
      ),
    },
  ];

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, currentNotification, dismissCurrentNotification } = useNotifications();
  const { t } = useTranslation();

  // Bascule dark/light
  const toggleColorMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Appliquer le mode dark/light dans le DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Gestion du redimensionnement pour la sidebar
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      setIsSidebarOpen(width >= 1024);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Définition des éléments du menu avec identifiants pour Joyride
  const menuItems = useMemo(
    () => [
      { id: "list", label: t("list"), icon: ListTodo },
      { id: "kanban", label: t("kanban"), icon: LayoutGrid },
      { id: "calendar", label: t("calendar"), icon: Calendar },
      { id: "stats", label: t("stats"), icon: BarChart2 },
      { id: "maintenance", label: "Maintenance", icon: Wrench },
      { id: "profile", label: t("profile"), icon: User },
    ],
    [t]
  );

  const adminMenuItem = useMemo(
    () => ({
      id: "admin",
      label: t("admin"),
      icon: Shield,
    }),
    [t]
  );

  const finalMenuItems = useMemo(() => {
    if (user?.role === "admin") {
      return [...menuItems, adminMenuItem];
    }
    return menuItems;
  }, [user?.role, menuItems, adminMenuItem]);

  // Fonction pour relancer le tutoriel
  const restartTour = () => {
    setRunTour(true);
  };

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  const renderContent = () => {
    switch (selectedView) {
      case "list":
        return <TaskList newTask={newTask} searchQuery={searchQuery} />;
      case "kanban":
        return <TaskKanban searchQuery={searchQuery} />;
      case "calendar":
        return <TaskCalendar />;
      case "stats":
        return <TaskStats />;
      case "maintenance":
        return <TaskListMaintenance newTask={newTask} />;
      case "profile":
        return <UserProfile />;
      case "admin":
        return user?.role === "admin" ? <AdminPanel /> : null;
      default:
        return <TaskList searchQuery={searchQuery} />;
    }
  };

  return (
    <>
      {/* Bouton invisible pour le tutoriel "Revoir le tuto" */}
      <div id="header-restart-tour" className="hidden" />

      {/* Joyride pour le tutoriel interactif */}
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={runTour}
        steps={tourSteps}
        showSkipButton
        styles={{
          options: {
            zIndex: 10000,
            backgroundColor: "#201F1F", // Fond de la carte du tuto
            textColor: "#fff",
            arrowColor: "#C5D200", // Flèche en vert
            primaryColor: "#C5D200", // Boutons verts
            spotlightBorderColor: "#C5D200", // Contour vert pour l'élément ciblé
          },
          buttonNext: { backgroundColor: "#C5D200", color: "#000" },
          buttonSkip: { backgroundColor: "#C5D200", color: "#000" },
        }}
      />

      <div className={cn("min-h-screen", isDarkMode ? "bg-[#1B1A1A] text-white" : "bg-white text-black")}>
        <div className="w-full">
          {/* Header en full width, aligné à gauche */}
          <header
            className={cn(
              "fixed top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-4 border-b",
              isDarkMode ? "bg-[#201F1A] border-[#323131]" : "bg-gray-100 border-gray-200"
            )}
          >
            {/* Zone gauche : logo et message */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Link to="/home" className="flex flex-col items-start mr-4">
                <img src={logoSrc} alt="Logo" className="h-8 w-auto mt-1 mb-1" />
                <span className="text-xs font-bold" style={{ color: "#C5D200" }}>
                  VILMAR
                </span>
              </Link>
              <div>
                <span className="text-xl font-semibold">
                  Hello, {user?.email ? getUsernameFromEmail(user.email) : "User"}
                </span>
              </div>
            </div>
            {/* Zone droite : boutons */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(true)}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-xs flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsTaskDialogOpen(true)}>
                <Plus className="h-5 w-5" />
              </Button>
              {/* Bouton dark/light */}
              <Button variant="ghost" size="icon" onClick={toggleColorMode}>
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              {/* Bouton Traduction */}
              <Button variant="ghost" size="icon" id="translate-button">
                <Globe className="h-5 w-5" />
              </Button>
              {/* Bouton "Revoir le tuto" */}
              <Button variant="ghost" size="icon" onClick={restartTour} id="header-restart-tour" className="heartbeat">
                <HelpCircle className="h-5 w-5" />
              </Button>
              {/* Dropdown pour déconnexion */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={cn(
                    isDarkMode ? "bg-[#323131] border-[#424242]" : "bg-white border-gray-300",
                    "w-56"
                  )}
                >
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Sidebar */}
          <aside
            className={cn(
              "fixed top-12 left-0 bottom-0 w-64 transition-transform duration-200 ease-in-out z-40 border-r",
              isDarkMode ? "bg-[#201F1A] border-[#323131]" : "bg-gray-50 border-gray-200",
              !isSidebarOpen && "-translate-x-full"
            )}
          >
            <ScrollArea className="h-full py-4">
              <div className="space-y-1 px-2">
                {finalMenuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => {
                      setSelectedView(item.id);
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full justify-start",
                      selectedView === item.id
                        ? (isDarkMode ? "bg-[#323131]" : "bg-gray-200")
                        : "",
                      item.id === currentTutorialTarget && "border-2 border-green-500"
                    )}
                    id={`menu-${item.id}`}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className={cn("pt-12 transition-all duration-200", isSidebarOpen ? "lg:pl-64" : "")}>
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-semibold">
                    {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)}
                  </h1>
                  {/* Bouton "Nouvelle tâche" */}
                  <Button
                    id="new-task-button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTaskDialogOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">{t("newTask")}</span>
                  </Button>
                </div>
              </div>
              <div
                className={cn(
                  "rounded-lg border shadow-lg",
                  isDarkMode ? "bg-[#1B1A1A] border-[#323131]" : "bg-white border-gray-300"
                )}
              >
                {renderContent()}
              </div>
            </div>
          </main>

          {/* Notifications Panel */}
          <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
            <SheetContent
              className={cn(
                "w-full sm:max-w-md",
                isDarkMode ? "bg-[#201F1A] border-l border-[#323131]" : "bg-white border-l border-gray-200"
              )}
            >
              <NotificationPanel />
            </SheetContent>
          </Sheet>

          {/* Task Creation Dialog */}
          <TaskCreationDialog
            open={isTaskDialogOpen}
            onOpenChange={setIsTaskDialogOpen}
            onSuccess={() => setIsTaskDialogOpen(false)}
            onTaskCreated={setNewTask}
          />

          {/* Notification Popup */}
          <NotificationPopup notification={currentNotification} onClose={dismissCurrentNotification} />
        </div>
      </div>
    </>
  );
}
