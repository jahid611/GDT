"use client"

import { useState, useEffect } from "react"
import { getUsers } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { User2, Search, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNotifications } from "../contexts/NotificationContext"
import { motion, AnimatePresence } from "framer-motion"

export default function UserManagementList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isMobile, setIsMobile] = useState(false)
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

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t("searchUsers")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-2">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card dark:bg-card/80 gap-4"
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
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {user.role === "admin" ? t("adminRole") : t("userRole")}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredUsers.length === 0 && (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            {searchTerm ? t("noUsersFound") : t("noUsers")}
          </div>
        )}
      </div>
    </div>
  )
}

