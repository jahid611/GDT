"use client"

import { useState, useEffect } from "react"
import { getUsers } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { User2, Search, Loader2, AlertCircle, Users, Shield, RefreshCcw, UserCog } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNotifications } from "../contexts/NotificationContext"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const StatCard = ({ icon: Icon, label, value, className }) => (
  <div
    className={cn(
      "flex items-center gap-4 rounded-lg border bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50",
      "hover:border-primary/20 transition-all duration-300",
      "dark:shadow-lg dark:shadow-primary/5",
      className,
    )}
  >
    <div className="relative p-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="absolute inset-0 rounded-l-lg bg-gradient-to-r from-primary/5 to-transparent" />
    </div>
    <div className="pr-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  </div>
)

export default function UserManagementList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { t } = useTranslation()
  const { showToast } = useNotifications()

  useEffect(() => {
    loadUsers()

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      console.error("Error loading users:", err)
      setError(err.message || t("cannotLoadUsers"))
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadUsers()
    setIsRefreshing(false)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
  }

  if (loading) {
    return (
      <Card className="w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div className="absolute inset-0 h-12 w-12 rounded-full border-t-2 border-primary/20" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">{t("loadingUsers")}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4 animate-in fade-in-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {error}
          <Button variant="outline" size="sm" onClick={loadUsers} className="w-full sm:w-auto">
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={Users} label="Membres inscrits" value={stats.total} />
        <StatCard icon={Shield} label="Équipe administrative" value={stats.admins} />
      </div>

      <Card className="w-full border-none shadow-lg shadow-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserCog className="h-6 w-6 text-primary" />
                Gestion des membres
              </CardTitle>
              <CardDescription className="text-base">
                {filteredUsers.length} {filteredUsers.length > 1 ? "membres" : "membre"} au total
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="shrink-0 transition-all duration-300 hover:border-primary/50"
                  >
                    <RefreshCcw
                      className={cn("h-4 w-4 mr-2 transition-all duration-300", isRefreshing && "animate-spin")}
                    />
                    Actualiser
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rafraîchir la liste des membres</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-all duration-300 focus-visible:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-px bg-muted/50">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.05,
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background hover:bg-muted/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                          "group-hover:scale-110 group-hover:rotate-[360deg]",
                          user.role === "admin"
                            ? "bg-primary/10 text-primary ring-2 ring-primary/20"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <User2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{user.username || user.email}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-between sm:justify-end mt-4 sm:mt-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                                "hover:ring-2 hover:ring-offset-2 cursor-help",
                                user.role === "admin"
                                  ? "bg-primary/10 text-primary hover:ring-primary/20 hover:bg-primary/20"
                                  : "bg-muted text-muted-foreground hover:ring-muted hover:bg-muted/70",
                              )}
                            >
                              {user.role === "admin" ? "Administrateur" : "Membre"}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {user.role === "admin"
                                ? "Accès complet à toutes les fonctionnalités"
                                : "Accès standard aux fonctionnalités de base"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredUsers.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 bg-background"
                >
                  <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {searchTerm ? "Aucun membre trouvé" : "Aucun membre"}
                  </p>
                  <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm text-center">
                    {searchTerm ? "Essayez une autre recherche" : "Invitez des membres pour commencer"}
                  </p>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

