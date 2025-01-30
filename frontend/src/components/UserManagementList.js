import React, { useState, useEffect } from "react"
import { getUsers, deleteUser } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, User2, Search, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useNotifications } from "../contexts/NotificationContext"
import { motion, AnimatePresence } from "framer-motion"

export default function UserManagementList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [processingUser, setProcessingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
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

  const handleDeleteUser = async (userId) => {
    try {
      setProcessingUser(userId)
      await deleteUser(userId)
      setUsers(users.filter((user) => user._id !== userId))
      showToast(t("success"), t("userDeleted"))
      setUserToDelete(null)
    } catch (err) {
      console.error("Error deleting user:", err)
      showToast(t("error"), t("cannotDeleteUser"), "destructive")
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
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
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
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t("userList")}
        </CardTitle>
        <CardDescription>{t("userListDescription")}</CardDescription>
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
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.username || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.role === "admin" ? t("adminRole") : t("userRole")}
                      </div>
                    </div>
                    {user.role !== "admin" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setUserToDelete(user)}
                        disabled={processingUser === user._id}
                      >
                        {processingUser === user._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("deleteUser")}
                          </>
                        )}
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

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteUser")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteUserWarning", {
                username: userToDelete?.username || userToDelete?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => handleDeleteUser(userToDelete?._id)}>
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

