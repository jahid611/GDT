// Dashboard.jsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import Joyride, { STATUS } from "react-joyride"
import { useAuth } from "../contexts/AuthContext"
import TaskList from "./TaskList"
import TaskListMaintenance from "./TaskListMaintenance"
import TaskStats from "./TaskStats"
import TaskCalendar from "./TaskCalendar"
import TaskKanban from "./TaskKanban"
import UserProfile from "./UserProfile"
import AdminPanel from "./AdminPanel"
import TeamManagement from "./TeamManagement" // <-- Nouveau composant
import { useNotifications } from "../contexts/NotificationContext"
import { useTranslation } from "../hooks/useTranslation"

import {
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
  HelpCircle,
  Globe,
  Users,
} from "lucide-react"

import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu"
import { Sheet, SheetContent } from "../components/ui/sheet"
import { ScrollArea } from "../components/ui/scroll-area"
import NotificationPanel from "./NotificationPanel"
import NotificationPopup from "./NotificationPopup"
import TaskCreationDialog from "./TaskCreationDialog"
import { cn } from "../lib/utils"

// Style global pour l'animation heartbeat
const globalStyles = `
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  .heartbeat {
    animation: heartbeat 1.5s infinite;
  }
`
if (typeof window !== "undefined") {
  const styleTag = document.createElement("style")
  styleTag.innerHTML = globalStyles
  document.head.appendChild(styleTag)
}

const logoSrc = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-A4oA2peQSsUbnjIvgkqspXDTemvaV5.png"

const getUsernameFromEmail = (email) => {
  if (!email) return ""
  const prefix = email.split("@")[0]
  return prefix.replace(/\./g, " ")
}

export default function Dashboard() {
  // États principaux
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedView, setSelectedView] = useState("list")
  const [showNotifications, setShowNotifications] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // États pour le tutoriel
  const [runTour, setRunTour] = useState(false)
  const [currentTutorialTarget, setCurrentTutorialTarget] = useState(null)
  const tourSteps = [
    {
      target: "#menu-list",
      content: (
        <div className="flex items-center">
          <ListTodo className="h-5 w-5 mr-2" />
          <span>
            {`Le menu ${"Liste"} affiche toutes vos tâches. Vous pouvez y consulter, modifier ou supprimer chaque tâche.`}
          </span>
        </div>
      ),
    },
    // ... autres étapes du tutoriel
    {
      target: "#translate-button",
      content: (
        <div className="flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          <span>Cliquez ici pour changer la langue de l'application.</span>
        </div>
      ),
    },
    // ...
  ]

  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount, currentNotification, dismissCurrentNotification } = useNotifications()
  const { t, toggleLanguage } = useTranslation()

  // Bascule dark/light via le bouton
  const toggleColorMode = () => {
    setIsDarkMode((prev) => !prev)
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 1024)
      setIsSidebarOpen(width >= 1024)
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  // Menu principal
  const menuItems = useMemo(
    () => [
      { id: "list", label: t("list"), icon: ListTodo },
      { id: "kanban", label: t("kanban"), icon: LayoutGrid },
      { id: "calendar", label: t("calendar"), icon: Calendar },
      { id: "stats", label: t("stats"), icon: BarChart2 },
      { id: "maintenance", label: "Maintenance", icon: Wrench },
      { id: "profile", label: t("profile"), icon: User },
      { id: "team", label: t("team"), icon: Users },
    ],
    [t],
  )

  // Option d'administration
  const adminMenuItem = useMemo(
    () => ({
      id: "admin",
      label: t("Admin"),
      icon: Shield,
    }),
    [t],
  )

  const finalMenuItems = useMemo(() => {
    if (user?.role === "admin") {
      return [...menuItems, adminMenuItem]
    }
    return menuItems
  }, [user?.role, menuItems, adminMenuItem])

  const restartTour = () => {
    setRunTour(true)
  }

  const handleJoyrideCallback = (data) => {
    const { status } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false)
    }
  }

  const joyrideProps = {
    callback: handleJoyrideCallback,
    continuous: true,
    run: runTour,
    steps: tourSteps,
    showSkipButton: true,
    styles: {
      options: {
        zIndex: 10000,
        backgroundColor: "#201F1F",
        textColor: "#fff",
        arrowColor: "#C5D200",
        primaryColor: "#C5D200",
        spotlightBorderColor: "#C5D200",
      },
      buttonNext: { backgroundColor: "#C5D200", color: "#000" },
      buttonSkip: { backgroundColor: "#C5D200", color: "#000" },
    },
  }

  const renderContent = () => {
    switch (selectedView) {
      case "list":
        return <TaskList newTask={newTask} searchQuery={searchQuery} />
      case "kanban":
        return <TaskKanban searchQuery={searchQuery} />
      case "calendar":
        return <TaskCalendar />
      case "stats":
        return <TaskStats />
      case "maintenance":
        return <TaskListMaintenance newTask={newTask} />
      case "profile":
        return <UserProfile />
      case "team":
        return <TeamManagement />
      case "admin":
        return user?.role === "admin" ? <AdminPanel /> : null
      default:
        return <TaskList searchQuery={searchQuery} />
    }
  }

  return (
    <>
      <div id="header-restart-tour" className="hidden" />
      <Joyride {...joyrideProps} />

      <div className={cn("min-h-screen", isDarkMode ? "bg-[#1B1A1A] text-white" : "bg-white text-black")}>
        <div className="w-full">
          {/* Header */}
          <header
            className={cn(
              "fixed top-0 left-0 right-0 h-14 sm:h-16 z-50 flex items-center justify-between px-2 sm:px-4 border-b transition-colors duration-200",
              isDarkMode ? "bg-[#201F1A] border-[#323131]" : "bg-gray-100 border-gray-200",
            )}
          >
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <Link to="/home" className="flex items-center gap-2">
                <img src={logoSrc || "/placeholder.svg"} alt="Logo" className="h-6 sm:h-8 w-auto" />
                <span className="hidden sm:inline text-xs font-bold" style={{ color: "#B7B949" }}>
                  VILMAR
                </span>
              </Link>

              <div className="hidden sm:block">
                <span className="text-sm sm:text-base lg:text-xl font-semibold truncate max-w-[150px] sm:max-w-none">
                  Hello, {user?.email ? getUsernameFromEmail(user.email) : "User"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-[10px] sm:text-xs flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setIsTaskDialogOpen(true)}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={cn(
                    isDarkMode ? "bg-[#323131] border-[#424242]" : "bg-white border-gray-300",
                    "w-48 sm:w-56",
                  )}
                >
                  <DropdownMenuItem onClick={toggleColorMode}>
                    {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={toggleLanguage} id="translate-button">
                    <Globe className="mr-2 h-4 w-4" />
                    {t("language")}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={restartTour}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Tutorial
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Sidebar */}
          <div
            className={cn(
              "fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity",
              isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside
            className={cn(
              "fixed top-14 sm:top-16 left-0 bottom-0 w-[280px] sm:w-64 transition-all duration-300 ease-in-out z-40 border-r",
              isDarkMode ? "bg-[#201F1A] border-[#323131]" : "bg-gray-50 border-gray-200",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <ScrollArea className="h-full py-2 sm:py-4">
              <div className="space-y-1 px-2">
                {finalMenuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => {
                      setSelectedView(item.id)
                      if (isMobile) setIsSidebarOpen(false)
                    }}
                    className={cn(
                      "w-full justify-start h-10 sm:h-11 text-sm sm:text-base",
                      selectedView === item.id && (isDarkMode ? "bg-[#323131]" : "bg-gray-200"),
                      item.id === currentTutorialTarget && "border-2 border-green-500",
                    )}
                    id={`menu-${item.id}`}
                  >
                    <item.icon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          {/* Contenu principal */}
          <main className={cn("pt-14 sm:pt-16 transition-all duration-300", isSidebarOpen ? "lg:pl-64" : "")}>
            <div className="p-2 sm:p-4">
              <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h1 className="text-lg sm:text-2xl font-semibold">
                    {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)}
                  </h1>
                  <Button
                    id="new-task-button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTaskDialogOpen(true)}
                    className="flex items-center gap-1 text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{t("newTask")}</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="search"
                    placeholder={t("search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                  />
                </div>
              </div>

              <div
                className={cn(
                  "rounded-lg border shadow-lg",
                  isDarkMode ? "bg-[#1B1A1A] border-[#323131]" : "bg-white border-gray-300",
                )}
              >
                {renderContent()}
              </div>
            </div>
          </main>

          {/* Panels et Dialogs */}
          <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
            <SheetContent
              side="right"
              className={cn(
                "w-full sm:max-w-md p-4",
                isDarkMode ? "bg-[#201F1A] border-l border-[#323131]" : "bg-white border-l border-gray-200",
              )}
            >
              <NotificationPanel />
            </SheetContent>
          </Sheet>

          <TaskCreationDialog
            open={isTaskDialogOpen}
            onOpenChange={setIsTaskDialogOpen}
            onSuccess={() => setIsTaskDialogOpen(false)}
            onTaskCreated={setNewTask}
          />

          <NotificationPopup notification={currentNotification} onClose={dismissCurrentNotification} />
        </div>
      </div>
    </>
  )
}
