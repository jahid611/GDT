"use client"

import { useState, useEffect } from "react"
import { getUsers } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { User2, Search, Loader2, AlertCircle, Users, Shield, RefreshCcw, UserCog } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNotifications } from "../contexts/NotificationContext"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const StatCard = ({ icon: Icon, label, value, className }) => (
  <Card className={cn("overflow-hidden group", className)}>
    <div className="flex items-center gap-4 p-2 sm:p-4">
      <div className="relative shrink-0">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/5 to-transparent" />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  </Card>
)

export default function UserManagementList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { t } = useTranslation()
  const { showToast } = useNotifications()

  useEffect(() => {
    loadUsers()
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
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
  }

  if (loading) {
    return (
      <Card className="w-full min-h-[200px] sm:min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4 p-4">
          <div className="relative mx-auto">
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary" />
            <div className="absolute inset-0 h-8 w-8 sm:h-12 sm:w-12 rounded-full border-t-2 border-primary/20" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground animate-pulse">{t("loadingUsers")}</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-2 sm:m-4 animate-in fade-in-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-sm sm:text-base">{error}</span>
          <Button variant="outline" size="sm" onClick={loadUsers} className="w-full sm:w-auto">
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <StatCard icon={Users} label="Registered Members" value={stats.total} />
        <StatCard icon={Shield} label="Admin Team" value={stats.admins} />

      </div>

      <Card className="border-none shadow-lg shadow-primary/5">
        <CardHeader className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <UserCog className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                <span className="truncate">Member Management</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {filteredUsers.length} total {filteredUsers.length > 1 ? "members" : "member"}

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
                    className="w-full sm:w-auto shrink-0 transition-all duration-300 hover:border-primary/50"
                  >
                    <RefreshCcw
                      className={cn("h-4 w-4 mr-2 transition-all duration-300", isRefreshing && "animate-spin")}
                    />
                    Refresh

                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh member list</p>

                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              placeholder="Search for a member..."

              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 text-sm sm:text-base transition-all duration-300 focus-visible:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] sm:h-[600px]">
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-background hover:bg-muted/50 transition-all duration-300 group gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className={cn(
                          "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                          "group-hover:scale-110 group-hover:rotate-[360deg]",
                          user.role === "admin"
                            ? "bg-primary/10 text-primary ring-2 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <User2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {user.username || user.email}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 justify-end">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                                "hover:ring-2 hover:ring-offset-2 cursor-help touch-none",
                                user.role === "admin"
                                  ? "bg-primary/10 text-primary hover:ring-primary/20 hover:bg-primary/20"
                                  : "bg-muted text-muted-foreground hover:ring-muted hover:bg-muted/70"
                              )}
                            >
                              {user.role === "admin" ? "Admin" : "Member"}

                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="text-xs sm:text-sm">
                              {user.role === "admin"
                                ? "Full access to all features"
                                : "Standard access to basic features"}

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
                  className="flex flex-col items-center justify-center py-8 sm:py-12 bg-background"
                >
                  <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/30 mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-medium text-muted-foreground">
                    {searchTerm ? "No members found" : "No members"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground/60 mt-1 max-w-[250px] sm:max-w-sm text-center px-4">
                    {searchTerm ? "Try another search" : "Invite members to get started"}

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
