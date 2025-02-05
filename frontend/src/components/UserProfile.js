"use client"

import { useState, useEffect } from "react"
import { getUserProfile, getUsers } from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import { Loader2, Mail, User, AlertCircle, RefreshCw, Building, MapPin, Send } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useTranslation } from "../hooks/useTranslation"
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import emailjs from "@emailjs/browser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function UserProfile() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [admins, setAdmins] = useState([])
  const { t } = useTranslation()

  // États pour le formulaire de contact
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    emailjs.init("FiWAOQdkaG34q5-hc") // Initialisation de EmailJS
    const token = localStorage.getItem("token")
    console.log("Current auth token:", token ? "Present" : "Missing")
    console.log("Current user ID:", authUser?.id)
    loadProfile()
    loadAdmins()
  }, [authUser])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!authUser?.id) {
        throw new Error(t("unauthenticatedUser"))
      }

      const data = await getUserProfile(authUser.id)
      setProfile(data)
    } catch (err) {
      console.error("Error loading profile:", err)
      setError(err.message || t("cannotLoadProfile"))
    } finally {
      setLoading(false)
    }
  }

  const loadAdmins = async () => {
    try {
      const users = await getUsers()
      const adminUsers = users.filter((user) => user.role === "admin")
      setAdmins(adminUsers)
    } catch (err) {
      console.error("Error loading admins:", err)
    }
  }

  const handleContactAdmin = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim() || !selectedAdmin) return

    setIsSubmitting(true)
    try {
      const templateParams = {
        to_email: selectedAdmin,
        from_name: profile.email,
        subject: subject,
        message: message,
      }

      await emailjs.send("service_profile", "template_profile", templateParams)

      // Réinitialiser le formulaire
      setSubject("")
      setMessage("")
      setSelectedAdmin("")
      alert("Message envoyé avec succès")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Erreur lors de l'envoi du message")
    } finally {
      setIsSubmitting(false)
    }
  }

  const ProfileField = ({ icon: Icon, label, value }) => {
    return (
      <div className="space-y-2 rounded-lg border p-4 transition-colors hover:bg-accent/5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <p className="text-sm">{value || "-"}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-8"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">{t("loadingProfile")}</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            {error}
            <Button variant="outline" size="sm" onClick={loadProfile}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{t("profileNotFound")}</p>
        </div>
      </div>
    )
  }

  const displayName = profile.email ? profile.email.split("@")[0].replace(/[^a-zA-Z]/g, "") : "User"

  return (
    <div className="min-h-screen bg-background">
      <div className="h-full max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full space-y-6">
          <div className="bg-card rounded-xl shadow-lg overflow-hidden">
            {/* Banner et Avatar */}
            <div
              className="relative h-64 bg-center"
              style={{
                backgroundImage:
                  "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv-wlhUmDt4FKA4-tl_ccd5SXBRLBMSdV8Lg&s')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 text-center transform translate-y-1/2">
                <Avatar className="h-32 w-32 border-4 border-background mx-auto">
                  <AvatarImage
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AEcjwHjVlLNBd0ayFs7YNUVPQwreMy.png"
                    alt={t("userProfile")}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl">{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Contenu du profil */}
            <div className="pt-20 px-4 pb-8 md:px-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
                <p className="text-muted-foreground mt-1">{profile.email}</p>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="grid gap-6 md:grid-cols-2">
                  <ProfileField icon={User} label={t("name")} value={displayName} />
                  <ProfileField icon={Mail} label={t("email")} value={profile.email} />
                  <ProfileField icon={Building} label={t("department")} value={t("Râmnicu Vâlcea")} />
                  <ProfileField icon={MapPin} label={t("location")} value={t("Roumanie")} />
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de contact des admins */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contacter un administrateur
              </CardTitle>
              <CardDescription>Envoyez un message à l'équipe administrative</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Administrateur</Label>
                  <select
                    value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sélectionner un administrateur</option>
                    {admins.map((admin) => (
                      <option key={admin._id} value={admin.email}>
                        {admin.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Objet</Label>
                  <Input
                    placeholder="Objet de votre message"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Votre message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !subject.trim() || !message.trim() || !selectedAdmin}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default UserProfile

