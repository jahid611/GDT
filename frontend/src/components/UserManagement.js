"use client"

import { useState, useEffect } from "react"
import { getUsers, updateUserProfile } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, User2, Search, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RequireRole from "./RequireRole"
import { useNotifications } from "../contexts/NotificationContext"
import { motion, AnimatePresence } from "framer-motion"

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [processingUser, setProcessingUser] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const { t } = useTranslation()
  const { showToast } = useNotifications()

  useEffect(() => {
    loadUsers()

    // Détection du mobile
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

  const handlePromoteUser = async (userId) => {
    try {
      setProcessingUser(userId)
      const updatedUser = await updateUserProfile(userId, { role: "admin" })
      setUsers(users.map((user) => (user._id === userId ? { ...user, role: updatedUser.role } : user)))
      showToast(t("success"), t("userPromoted"))
    } catch (err) {
      console.error("Error promoting user:", err)
      showToast(t("error"), t("cannotPromoteUser"), "destructive")
    } finally {
      setProcessingUser(null)
    }
  }

  const handleDemoteUser = async (userId) => {
    try {
      setProcessingUser(userId)
      const updatedUser = await updateUserProfile(userId, { role: "user" })
      setUsers(users.map((user) => (user._id === userId ? { ...user, role: updatedUser.role } : user)))
      showToast(t("success"), t("userDemoted"))
    } catch (err) {
      console.error("Error demoting user:", err)
      showToast(t("error"), t("cannotDemoteUser"), "destructive")
    } finally {
      setProcessingUser(null)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          {error}
          <Button variant="outline" size="sm" onClick={loadUsers}>
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Shield className="h-5 w-5 text-primary" />
          {t("userManagement")}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">{t("userManagementDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("searchUsers")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.username || user.email}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.role === "admin" ? t("adminRole") : t("userRole")}
                      </div>
                    </div>
                    {user.role === "admin" ? (
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        onClick={() => handleDemoteUser(user._id)}
                        disabled={processingUser === user._id}
                        className="w-full sm:w-auto"
                      >
                        {processingUser === user._id ? <Loader2 className="h-4 w-4 animate-spin" /> : t("removeAdmin")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        onClick={() => handlePromoteUser(user._id)}
                        disabled={processingUser === user._id}
                        className="w-full sm:w-auto"
                      >
                        {processingUser === user._id ? <Loader2 className="h-4 w-4 animate-spin" /> : t("makeAdmin")}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? t("noUsersFound") : t("noUsers")}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function UserManagementWrapper() {
  return (
    <RequireRole role="admin">
      <UserManagement />
    </RequireRole>
  )
}

