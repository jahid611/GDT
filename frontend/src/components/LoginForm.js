"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../utils/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, LogIn } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validation basique côté client
      if (!formData.email || !formData.password) {
        throw new Error("Veuillez remplir tous les champs")
      }

      const response = await login(formData)
      if (response?.token) {
        localStorage.setItem("token", response.token)
        navigate("/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)

      // Gestion spécifique des erreurs
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError("Email ou mot de passe incorrect")
            break
          case 404:
            setError("Aucun compte ne correspond à cette adresse email")
            break
          case 429:
            setError("Trop de tentatives. Veuillez réessayer dans quelques minutes")
            break
          case 500:
            setError("Erreur serveur. Veuillez réessayer plus tard")
            break
          default:
            setError(err.response.data?.message || "Erreur lors de la connexion")
        }
      } else if (err.code === "ECONNABORTED") {
        setError("La requête a pris trop de temps. Vérifiez votre connexion")
      } else if (!err.response && err.message) {
        setError(err.message)
      } else {
        setError("Une erreur inattendue s'est produite")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError("") // Efface l'erreur quand l'utilisateur tape
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Connectez-vous à votre compte pour accéder à vos tâches
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur de connexion</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mot de passe</label>
              <Input
                type="password"
                name="password"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

