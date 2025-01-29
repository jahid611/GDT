import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { login } from "../utils/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"
import AuthLayout from "./AuthLayout"

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
      <div className="flex items-center justify-center p-4 min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{t("login")}</CardTitle>
            <CardDescription className="text-center">{t("loginDescription")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loggingIn")}
                  </>
                ) : (
                  t("loginButton")
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthLayout>
  )
}

