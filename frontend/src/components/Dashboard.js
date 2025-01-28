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
import { LayoutGrid, Calendar, ListTodo, BarChart2, User, LogOut, Menu, X, Bell, Plus, Shield } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import NotificationPanel from "./NotificationPanel"
import NotificationPopup from "./NotificationPopup"
import { cn } from "@/lib/utils"
import TaskCreationDialog from "./TaskCreationDialog"

const menuItems = [
  { id: "list", label: "Tâches", icon: ListTodo },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
  { id: "calendar", label: "Calendrier", icon: Calendar },
  { id: "stats", label: "Statistiques", icon: BarChart2 },
  { id: "profile", label: "Profil", icon: User },
]

const adminMenuItem = { id: "admin", label: "Administration", icon: Shield }

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedView, setSelectedView] = useState("list")
  const [showNotifications, setShowNotifications] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount, currentNotification, dismissCurrentNotification } = useNotifications()

  const finalMenuItems = React.useMemo(() => {
    if (user?.role === 'admin') {
      return [...menuItems, adminMenuItem]
    }
    return menuItems
  }, [user?.role])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
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
      setSelectedView('list')
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
        return user?.role === 'admin' ? <AdminPanel /> : null
      default:
        return <TaskList />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar pour desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Mes Tâches</h1>
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-1">
              {finalMenuItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => setSelectedView(item.id)}
                  variant={selectedView === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-6">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-background border-b">
          <Button variant="ghost" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mes Tâches</h1>
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
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <NotificationPanel />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content */}
      <main className={cn("min-h-screen transition-all duration-300 ease-in-out", isSidebarOpen ? "lg:pl-64" : "")}>
        <div className="container mx-auto p-4 lg:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">
                  Bienvenue, {user?.name}
                  {user?.role === 'admin' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      Admin
                    </span>
                  )}
                </h2>
              </div>
              {selectedView !== 'admin' && (
                <Button onClick={() => setIsTaskDialogOpen(true)}>
                  <Plus className="mr-2 h-5 w-5" />
                  Nouvelle tâche
                </Button>
              )}
            </div>
          </div>
          {renderContent()}
        </div>
      </main>

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
            <Button size="lg" className="rounded-full relative shadow-lg">
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
              <SheetTitle>Notifications</SheetTitle>
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
  )
}