import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { login } from "../utils/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, LogIn } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"
import AuthLayout from "./AuthLayout"
import { motion } from "framer-motion"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError("")
      setLoading(true)
      const response = await login({ email, password })
      authLogin(response.user)
      navigate("/")
    } catch (err) {
      console.error("Login error:", err)
      setError(err.message || t("loginError"))
    } finally {
      setLoading(false)
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
          <Card className="backdrop-blur-sm bg-background/95 dark:bg-background/80 shadow-xl border-border/50 dark:border-border/20">
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
                <CardDescription>{t("loginDescription")}</CardDescription>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t("email")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-background dark:bg-background/50"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 bg-background dark:bg-background/50"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-4">
                <Button
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
                <div className="text-center text-sm">
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
    </AuthLayout>
  )
}

