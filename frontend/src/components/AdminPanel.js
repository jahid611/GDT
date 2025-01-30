import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { register } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { User, Mail, Lock, UserPlus, Shield } from "lucide-react"
import { useNotifications } from "../contexts/NotificationContext"
import RequireRole from "./RequireRole"
import UserManagementList from "./UserManagementList"

function AdminPanel() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useNotifications()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // Rôle fixé à "user"
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordMismatch"))
      setLoading(false)
      return
    }

    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }

      await register(userData)
      showToast(t("success"), t("userCreatedSuccess"))

      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user",
      })
    } catch (err) {
      setError(err.message || t("userCreationError"))
      showToast(t("error"), err.message || t("userCreationError"), "destructive")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>{t("adminArea")}</CardTitle>
              <CardDescription>{t("adminOnly")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="backdrop-blur-sm bg-card shadow-xl">
              <CardHeader className="space-y-4 pb-8">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="rounded-full bg-gradient-to-tr from-primary/80 to-primary p-3"
                  >
                    <Shield className="h-6 w-6 text-primary-foreground" />
                  </motion.div>
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="text-2xl font-bold tracking-tight">{t("adminCreateUser")}</CardTitle>
                  <CardDescription className="text-muted-foreground">{t("adminCreateUserDescription")}</CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      {t("username")}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        placeholder={t("usernamePlaceholder")}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t("email")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t("emailPlaceholder")}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {t("password")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t("passwordPlaceholder")}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      {t("confirmPassword")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder={t("confirmPasswordPlaceholder")}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 animate-pulse" />
                        {t("creatingUser")}
                      </motion.div>
                    ) : (
                      <motion.div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        {t("createUser")}
                      </motion.div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Liste de gestion des utilisateurs */}
          <UserManagementList />
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap with RequireRole to ensure only admins can access
export default function AdminPanelWrapper() {
  return (
    <RequireRole role="admin">
      <AdminPanel />
    </RequireRole>
  )
}

