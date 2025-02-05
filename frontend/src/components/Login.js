"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { login } from "../utils/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Mail, Lock, LogIn, AlertCircle } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"
import { motion, AnimatePresence } from "framer-motion"
import TutorialProvider from "@/components/AdvancedTutorial"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Vérifier si le tutoriel a déjà été vu
  const [hasSeenTutorial] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("login-tutorial-seen") === "true"
    }
    return false
  })

  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const { t } = useTranslation()

  // Définition des étapes du tutoriel
  const tutorialSteps = [
    {
      targetId: "logo-link",
      title: "Navigation rapide",
      text: "Cliquez ici pour retourner à l'accueil à tout moment",
    },
    {
      targetId: "login-form",
      title: "Connexion sécurisée",
      text: "Connectez-vous à votre espace personnel Vilmar",
    },
    {
      targetId: "email-input",
      title: "Votre email",
      text: "Entrez l'adresse email associée à votre compte",
    },
    {
      targetId: "password-input",
      title: "Mot de passe",
      text: "Saisissez votre mot de passe en toute sécurité",
    },
    {
      targetId: "login-button",
      title: "Accéder à votre espace",
      text: "Cliquez pour vous connecter à votre compte",
    },
    {
      targetId: "register-link",
      title: "Nouveau chez Vilmar ?",
      text: "Créez votre compte en quelques clics",
    },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError("")
      setLoading(true)

      if (!email || !password) {
        setError("Aucun compte existant")
        return
      }

      const response = await login({ email, password })

      if (response?.user) {
        authLogin(response.user)
        navigate("/dashboard")
      } else {
        setError("Aucun compte existant")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Aucun compte existant")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = () => {
    if (error) setError("")
  }

  const handleTutorialComplete = () => {
    localStorage.setItem("login-tutorial-seen", "true")
  }

  return (
    <TutorialProvider
      steps={tutorialSteps}
      stepDuration={3500}
      pageKey="login-page"
      autoStart={!hasSeenTutorial} // Ne démarre automatiquement que si jamais vu
      onComplete={handleTutorialComplete}
    >
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-background dark:via-background dark:to-black">
        <Link
          id="logo-link"
          to="/"
          className="absolute top-4 left-4 transform hover:scale-105 transition-transform duration-200"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/output-onlinepngtools-6Op0lM7vaXM8Q1f4QQ3GZoaRPc2GAv.png"
            alt="Logo"
            className="h-8 w-8"
          />
          <span className="sr-only">Retour à l'accueil</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card
            id="login-form"
            className="backdrop-blur-sm bg-background/95 dark:bg-zinc-900/90 shadow-xl border-border/50 dark:border-border/20"
          >
            <CardHeader className="space-y-4 pb-8">
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="rounded-full bg-gradient-to-tr from-primary/90 to-primary dark:from-primary/70 dark:to-primary/90 p-3"
                >
                  <LogIn className="h-6 w-6 text-primary-foreground" />
                </motion.div>
              </div>
              <div className="space-y-2 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">{t("login")}</CardTitle>
                <CardDescription className="dark:text-muted-foreground">{t("loginDescription")}</CardDescription>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle className="mb-1 font-medium">Erreur de connexion</AlertTitle>
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t("email")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email-input"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        handleInputChange()
                      }}
                      required
                      className="pl-10 bg-background/50 dark:bg-background/10"
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
                      id="password-input"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        handleInputChange()
                      }}
                      required
                      className="pl-10 bg-background/50 dark:bg-background/10"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-4">
                <Button
                  id="login-button"
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary dark:from-primary/80 dark:to-primary hover:dark:from-primary/70 hover:dark:to-primary/90 text-primary-foreground"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("loggingIn")}
                    </>
                  ) : (
                    t("loginButton")
                  )}
                </Button>
                <div id="register-link" className="text-center text-sm">
                  <span className="text-muted-foreground">{t("noAccount")}</span>{" "}
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:text-primary/90 dark:text-primary/90 dark:hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    {t("createAccountLink")}
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </TutorialProvider>
  )
}

