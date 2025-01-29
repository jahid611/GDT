import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User } from "lucide-react"
import { register } from "../utils/api"
import { useTranslation } from "../hooks/useTranslation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import AuthLayout from "./AuthLayout"

function RegisterForm() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordMismatch"))
      return
    }

    try {
      await register(formData)
      navigate("/login")
    } catch (err) {
      setError(err.message || t("registrationError"))
    }
  }

  return (
    <AuthLayout>
      <div className="min-h-screen flex flex-col justify-center p-4">
        <div className="mx-auto w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-emerald-100 rounded-full p-3">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">{t("createAccount")}</CardTitle>
              <CardDescription className="text-center">{t("registerDescription")}</CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t("username")}</Label>
                  <Input
                    id="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={t("usernamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("emailPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("passwordPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t("confirmPasswordPlaceholder")}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {t("createAccountButton")}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">{t("alreadyHaveAccount")}</span>{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  {t("loginLink")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  )
}

export default RegisterForm

