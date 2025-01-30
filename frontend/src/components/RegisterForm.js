import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Mail, Lock, UserPlus, Loader2 } from "lucide-react"
import { register } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import AuthLayout from "./AuthLayout"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

function RegisterForm() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // Changed from "admin" to "user"
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    // Username validation - minimum 3 characters
    if (!formData.username || formData.username.trim().length < 3) {
      newErrors.username = t("usernameMinLength", "Le nom d'utilisateur doit contenir au moins 3 caractères")
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = t("invalidEmail", "Veuillez entrer une adresse email valide")
    }

    // Password validation - minimum 6 characters
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = t("passwordMinLength", "Le mot de passe doit contenir au moins 6 caractères")
    }

    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("passwordMismatch")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: id === "username" ? value.trim() : value,
    }))
    // Clear error when field is modified
    if (errors[id]) {
      setErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      setErrors({})

      await register({
        username: formData.username.trim(),
        email: formData.email,
        password: formData.password,
        role: "user",
      })

      navigate("/login")
    } catch (err) {
      console.error("Registration error:", err)

      if (err.response?.data?.errors) {
        const serverErrors = {}
        Object.entries(err.response.data.errors).forEach(([field, error]) => {
          serverErrors[field] = error.message || t("validationError")
        })
        setErrors(serverErrors)
      } else {
        setErrors({
          submit: err.message || t("registrationError"),
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="backdrop-blur-sm bg-white/90 shadow-xl border-neutral-200/50">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="rounded-full bg-gradient-to-tr from-primary/80 to-primary p-3"
                >
                  <UserPlus className="h-6 w-6 text-white" />
                </motion.div>
              </div>
              <div className="space-y-2 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">{t("createAccount")}</CardTitle>
                <CardDescription className="text-muted-foreground">{t("registerDescription")}</CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {errors.submit && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <Alert variant="destructive">
                    <AlertDescription>{errors.submit}</AlertDescription>
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
                      className={cn("pl-10", errors.username && "border-red-500")}
                    />
                  </div>
                  {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
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
                      className={cn("pl-10", errors.email && "border-red-500")}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
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
                      className={cn("pl-10", errors.password && "border-red-500")}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
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
                      className={cn("pl-10", errors.confirmPassword && "border-red-500")}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("creating")}
                    </>
                  ) : (
                    t("createAccountButton")
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">{t("alreadyHaveAccount")}</span>{" "}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:text-primary/90 transition-colors underline-offset-4 hover:underline"
                  >
                    {t("loginLink")}
                  </Link>
                </div>
              </form>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p>
                  {t(
                    "adminPrivilegeInfo",
                    "Pour obtenir des privilèges d'administrateur, veuillez contacter un administrateur existant après la création de votre compte.",
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuthLayout>
  )
}

export default RegisterForm

