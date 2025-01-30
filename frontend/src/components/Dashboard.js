import React, { useState, useEffect } from "react"
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
  Menu,
  X,
  Bell,
  Plus,
  Shield,
  ChevronLeft,
  Sun,
  Moon,
  Laptop,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import NotificationPanel from "./NotificationPanel"
import NotificationPopup from "./NotificationPopup"
import { cn } from "@/lib/utils"
import TaskCreationDialog from "./TaskCreationDialog"
import LanguageToggle from "./LanguageToggle"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "../contexts/ThemeContext" // Updated import
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedView, setSelectedView] = useState("list")
  const [showNotifications, setShowNotifications] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount, currentNotification, dismissCurrentNotification } = useNotifications()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme() // Updated destructuring

  const menuItems = React.useMemo(
    () => [
      { id: "list", label: t("list"), icon: ListTodo },
      { id: "kanban", label: t("kanban"), icon: LayoutGrid },
      { id: "calendar", label: t("calendar"), icon: Calendar },
      { id: "stats", label: t("stats"), icon: BarChart2 },
      { id: "profile", label: t("profile"), icon: User },
    ],
    [t],
  )

  const adminMenuItem = React.useMemo(
    () => ({
      id: "admin",
      label: t("admin"),
      icon: Shield,
    }),
    [t],
  )

  const finalMenuItems = React.useMemo(() => {
    if (user?.role === "admin") {
      return [...menuItems, adminMenuItem]
    }
    return menuItems
  }, [user?.role, menuItems, adminMenuItem])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "k":
            e.preventDefault()
            setIsTaskDialogOpen(true)
            break
          case "b":
            e.preventDefault()
            setIsSidebarOpen((prev) => !prev)
            break
          default:
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
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

  const renderContent = () => {
    switch (selectedView) {
      case "list":
        return <TaskList newTask={newTask} />
      case "kanban":
        return <TaskKanban />
      case "calendar":
        return <TaskCalendar />
      case "stats":
        return <TaskStats />
      case "profile":
        return <UserProfile />
      case "admin":
        return user?.role === "admin" ? <AdminPanel /> : null
      default:
        return <TaskList />
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Sidebar pour desktop */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r lg:translate-x-0 backdrop-blur-md bg-opacity-90"
            >
              <div className="flex flex-col h-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">{t("myTasks")}</h1>
                    <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="space-y-1">
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
                              selectedView === item.id && "font-medium",
                            )}
                          >
                            <item.icon className="mr-2 h-5 w-5" />
                            {item.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="hidden lg:block">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </nav>
                </div>
                <div className="mt-auto p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <LanguageToggle />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="h-4 w-4 mr-2" />
                            Light
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="h-4 w-4 mr-2" />
                            Dark
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                              setTheme(prefersDark ? "dark" : "light")
                            }}
                          >
                            {" "}
                            {/* Updated system theme toggle */}
                            <Laptop className="h-4 w-4 mr-2" />
                            System
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      {t("logout")}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Ctrl/⌘ + K - {t("newTask")}</p>
                    <p>Ctrl/⌘ + B - {t("toggleSidebar")}</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Header mobile */}
        <div className="sticky top-0 z-40 lg:hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-md border-b">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">{t("myTasks")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                      setTheme(prefersDark ? "dark" : "light")
                    }}
                  >
                    <Laptop className="h-4 w-4 mr-2" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center bg-primary text-primary-foreground rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t("notifications")}</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                    <NotificationPanel />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main
          className={cn(
            "min-h-screen transition-all duration-300 ease-in-out pb-16 lg:pb-0",
            isSidebarOpen ? "lg:pl-64" : "",
          )}
        >
          <div className="container mx-auto p-4 lg:p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!isMobile && !isSidebarOpen && (
                    <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(true)} className="mr-2">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <h2 className="text-2xl font-bold lg:text-3xl">
                    {t("welcome")}, {user?.email ? user.email.split("@")[0].replace(/\./g, " ") : user?.name}
                  </h2>
                </div>
                <Button onClick={() => setIsTaskDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">{t("newTask")}</span>
                </Button>
              </div>
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Navigation mobile */}
        {isMobile && (
          <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t"
          >
            <div className="flex justify-around items-center p-2">
              {menuItems.slice(0, 4).map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedView === item.id ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedView(item.id)}
                      className="flex-col gap-1 h-auto py-2"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs">{item.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{item.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </motion.nav>
        )}

        {/* Task Creation Dialog */}
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

        {/* Notification button (desktop) */}
        <div className="fixed bottom-4 right-4 hidden lg:block">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full relative shadow-lg hover:shadow-xl transition-shadow">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center bg-primary text-primary-foreground rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t("notifications")}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <NotificationPanel />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Notification Popup */}
        <NotificationPopup
          notification={currentNotification}
          onClose={dismissCurrentNotification}
          onView={handleViewNotification}
        />
      </div>
    </TooltipProvider>
  )
}

