import React, { useState, useEffect } from "react"
import { getUserProfile } from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import { Loader2, Mail, User, Shield } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "../hooks/useTranslation"

export default function UserProfile() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t, language } = useTranslation()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Loading user profile...")

        if (!authUser?.id) {
          throw new Error(t("unauthenticatedUser"))
        }

        const data = await getUserProfile(authUser.id)
        console.log("Profile received:", data)
        setProfile(data)
      } catch (err) {
        console.error("Error loading profile:", err)
        setError(err.message || t("cannotLoadProfile"))
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [authUser?.id, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">{t("loadingProfile")}</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>
          {error}
          <button onClick={() => window.location.reload()} className="ml-2 underline hover:no-underline">
            {t("retry")}
          </button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>{t("profileNotFound")}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t("userProfile")}</h2>
            <Badge variant={profile.role === "admin" ? "destructive" : "secondary"}>{profile.role}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("name")}</p>
                <p className="text-lg">{profile.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("email")}</p>
                <p className="text-lg">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("role")}</p>
                <p className="text-lg capitalize">{profile.role}</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              {t("memberSince")}:{" "}
              {new Date(profile.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

