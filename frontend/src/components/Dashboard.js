"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import TaskList from "./TaskList"
import TaskStats from "./TaskStats"
import TaskCalendar from "./TaskCalendar"
import TaskKanban from "./TaskKanban"
import UserProfile from "./UserProfile"
import AdminPanel from "./AdminPanel"
import { useNotifications } from "../contexts/NotificationContext"
import { useTranslation } from "../hooks/useTranslation"
import {
  LayoutGrid,
  Calendar,
  ListTodo,
  BarChart2,
  User,
  LogOut,
  X,
  Bell,
  Plus,
  Shield,
  ChevronLeft,
  Menu,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet"
import { ScrollArea } from "../components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "../components/ui/tooltip"
import NotificationPanel from "./NotificationPanel"
import NotificationPopup from "./NotificationPopup"
import { cn } from "../lib/utils"
import TaskCreationDialog from "./TaskCreationDialog"
import { motion, AnimatePresence } from "framer-motion"

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedView, setSelectedView] = useState("list")
  const [showNotifications, setShowNotifications] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchVisible, setIsSearchVisible] = useState(false)

  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount, currentNotification, dismissCurrentNotification } = useNotifications()
  const { t } = useTranslation()

  const menuItems = useMemo(
    () => [
      { id: "list", label: t("list"), icon: ListTodo },
      { id: "kanban", label: t("kanban"), icon: LayoutGrid },
      { id: "calendar", label: t("calendar"), icon: Calendar },
      { id: "stats", label: t("stats"), icon: BarChart2 },
      { id: "profile", label: t("profile"), icon: User },
    ],
    [t],
  )

  const adminMenuItem = useMemo(
    () => ({
      id: "admin",
      label: t("admin"),
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

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 1024)
      setIsSidebarOpen(width >= 1024)
      setIsSearchVisible(width >= 640)
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
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const handleViewNotification = (notification) => {
    if (notification.taskId) {
      setSelectedView("list")
    }
  }

  const cleanUsername = (email) => {
    if (!email) return ""
    return email
      .split("@")[0]
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase()
      .trim()
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
      case "profile":
        return <UserProfile />
      case "admin":
        return user?.role === "admin" ? <AdminPanel /> : null
      default:
        return <TaskList searchQuery={searchQuery} />
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 transition-colors duration-300">
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
                duration: 0.15,
              }}
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-[280px] border-r",
                "lg:w-72 lg:translate-x-0",
                "transform transition-all duration-100 ease-out",
                "backdrop-blur-md bg-opacity-90",
                "dark:bg-[#111113]/95 dark:border-white/[0.08]",
                "shadow-xl dark:shadow-2xl shadow-black/5",
                isMobile ? "w-full sm:w-[280px]" : "",
              )}
            >
              <div className="flex flex-col h-full p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t("myTasks")}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden hover:bg-white/10 transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav className="space-y-1.5 flex-1">
                  {finalMenuItems.map((item) => (
                    <Tooltip key={item.id} delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => {
                            setSelectedView(item.id)
                            if (isMobile) setIsSidebarOpen(false)
                          }}
                          variant={selectedView === item.id ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start transition-all duration-200",
                            "text-sm sm:text-base",
                            selectedView === item.id
                              ? "dark:bg-white/10 dark:text-foreground font-medium"
                              : "dark:text-foreground/80 dark:hover:bg-white/5 dark:hover:text-foreground",
                            "group",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200",
                              "group-hover:scale-110",
                            )}
                          />
                          {item.label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="hidden lg:block dark:bg-black/95 dark:border-white/10">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </nav>

                <div className="space-y-4 pt-6 border-t dark:border-white/[0.08]">
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      "text-red-500 hover:text-red-600",
                      "hover:bg-red-500/10",
                      "dark:text-red-500 dark:hover:text-red-400",
                      "dark:hover:bg-red-950/30",
                      "transition-colors duration-200",
                    )}
                  >
                    <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {t("logout")}
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="sticky top-0 z-40 lg:hidden">
          <div className="flex items-center justify-between px-3 py-2 sm:px-4 dark:bg-black/95 backdrop-blur-md border-b dark:border-white/[0.08] shadow-lg">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="dark:hover:bg-white/5"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-base sm:text-lg font-semibold text-foreground">{t("myTasks")}</h1>
            </div>
            <div></div>
          </div>
        </div>

        <main
          className={cn(
            "min-h-screen transition-all duration-300 ease-in-out pb-16 lg:pb-0",
            isSidebarOpen ? "lg:pl-72" : "",
            "pt-[60px] lg:pt-0",
            "dark:bg-zinc-950",
          )}
        >
          <div className="container mx-auto px-3 py-4 sm:p-4 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-2">
                {!isMobile && !isSidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(true)}
                    className="mr-2 dark:hover:bg-white/5"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {t("welcome")}, {user?.email ? cleanUsername(user.email) : cleanUsername(user?.name)}
                </h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative">
                  <Button
                    size="icon"
                    onClick={() => setShowNotifications(true)}
                    variant="outline"
                    className={cn(
                      "rounded-full relative",
                      "shadow-lg hover:shadow-xl",
                      "transition-all duration-200",
                      "h-9 w-9 sm:h-10 sm:w-10",
                      "dark:bg-white/5 dark:border-white/10",
                      "dark:hover:bg-white/10 dark:hover:border-white/20",
                    )}
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 text-xs flex items-center justify-center bg-primary text-white rounded-full animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => setIsTaskDialogOpen(true)}
                  size="default"
                  className={cn(
                    "bg-primary hover:bg-primary/90",
                    "shadow-lg hover:shadow-xl",
                    "transition-all duration-200",
                    "dark:bg-white dark:text-black",
                    "dark:hover:bg-white/90",
                    "font-medium",
                  )}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                  <span className="hidden sm:inline">{t("newTask")}</span>
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "rounded-xl border p-4 sm:p-6",
                  "dark:bg-black/40 dark:border-white/[0.08]",
                  "shadow-lg hover:shadow-xl transition-all duration-500",
                  "backdrop-blur-sm",
                )}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
          <SheetContent
            className={cn("w-full sm:max-w-md", "dark:bg-black/95 dark:border-white/[0.08]", "backdrop-blur-xl")}
          >
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold dark:text-foreground">{t("notifications")}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
              <NotificationPanel />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <TaskCreationDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          onSuccess={() => {
            setIsTaskDialogOpen(false)
          }}
          onTaskCreated={(task) => {
            setNewTask(task)
          }}
        />

        <NotificationPopup
          notification={currentNotification}
          onClose={dismissCurrentNotification}
          onView={handleViewNotification}
        />

        <footer className="fixed bottom-0 w-full py-4 lg:hidden dark:bg-black/95 dark:border-t dark:border-white/[0.08] backdrop-blur-md">
          <div className="container flex items-center justify-center px-4">
            <p className="text-sm text-muted-foreground dark:text-foreground/60">© 2025 Vilmar Tasks Manager</p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}

