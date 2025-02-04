import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Mail, Lock, UserPlus, Loader2, Home } from "lucide-react"
import { register } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
    role: "user",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username || formData.username.trim().length < 3) {
      newErrors.username = t("usernameMinLength", "Le nom d'utilisateur doit contenir au moins 3 caractères")
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = t("invalidEmail", "Veuillez entrer une adresse email valide")
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = t("passwordMinLength", "Le mot de passe doit contenir au moins 6 caractères")
    }

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-background dark:via-background dark:to-black">
      <Link
        to="/"
        className="absolute top-4 left-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors"
      >
        <Home className="h-6 w-6 text-primary" />
        <span className="sr-only">Retour à l'accueil</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-background/95 dark:bg-background/80 shadow-xl border-border/50 dark:border-border/20">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="rounded-full bg-gradient-to-tr from-primary/90 to-primary dark:from-primary/70 dark:to-primary/90 p-3"
              >
                <UserPlus className="h-6 w-6 text-primary-foreground" />
              </motion.div>
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight">{t("createAccount")}</CardTitle>
              <CardDescription>{t("registerDescription")}</CardDescription>
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
                    className={cn(
                      "pl-10 bg-background dark:bg-background/50",
                      errors.username && "border-destructive dark:border-destructive",
                    )}
                  />
                </div>
                {errors.username && <p className="text-sm text-destructive mt-1">{errors.username}</p>}
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
                    className={cn(
                      "pl-10 bg-background dark:bg-background/50",
                      errors.email && "border-destructive dark:border-destructive",
                    )}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
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
                    className={cn(
                      "pl-10 bg-background dark:bg-background/50",
                      errors.password && "border-destructive dark:border-destructive",
                    )}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
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
                    className={cn(
                      "pl-10 bg-background dark:bg-background/50",
                      errors.confirmPassword && "border-destructive dark:border-destructive",
                    )}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary dark:from-primary/80 dark:to-primary hover:dark:from-primary/70 hover:dark:to-primary/90 text-primary-foreground"
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
                  className="font-medium text-primary hover:text-primary/90 dark:text-primary/90 dark:hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  {t("loginLink")}
                </Link>
              </div>
            </form>
            <div className="mt-4 p-4 bg-muted/50 dark:bg-muted/20 rounded-lg text-sm text-muted-foreground">
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
  )
}

export default RegisterForm

