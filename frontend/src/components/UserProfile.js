"use client"

import { useState, useEffect } from "react"
import { getUserProfile, getUsers } from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import {
  Loader2,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  Building,
  MapPin,
  Send,
  Bold,
  Italic,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import emailjs from "@emailjs/browser"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

function UserProfile() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [admins, setAdmins] = useState([])
  const [profileImage, setProfileImage] = useState(null)
  const { toast } = useToast()

  // States for the contact form
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // States for message formatting
  const [messageFormat, setMessageFormat] = useState({
    bold: false,
    italic: false,
    align: "left",
    isList: false,
  })

  // Function to generate an image with initials from the email
  const generateInitialsImage = async (email) => {
    try {
      const [localPart] = email.split("@")
      const nameParts = localPart.split(/[._]/)
      const firstInitial = nameParts[0].charAt(0).toUpperCase()
      const secondInitial =
        nameParts.length > 1
          ? nameParts[nameParts.length - 1].charAt(0).toUpperCase()
          : nameParts[0].charAt(1).toUpperCase()
      const initials = `${firstInitial}${secondInitial}`
      const canvas = document.createElement("canvas")
      canvas.width = 200
      canvas.height = 200
      const img = new Image()
      img.crossOrigin = "anonymous"
      return new Promise((resolve, reject) => {
        img.onload = () => {
          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0, 200, 200)
          ctx.font = "bold 32px sans-serif"
          ctx.fillStyle = "black"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(initials, 100, 75)
          resolve(canvas.toDataURL("image/png"))
        }
        img.onerror = reject
        img.src =
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AEcjwHjVlLNBd0ayFs7YNUVPQwreMy.png"
      })
    } catch (error) {
      console.error("Error generating initials image:", error)
      throw error
    }
  }

  useEffect(() => {
    emailjs.init("FiWAOQdkaG34q5-hc")
    loadProfile()
    loadAdmins()
  }, [authUser])

  useEffect(() => {
    const generateProfileImage = async () => {
      if (profile?.email) {
        try {
          const imageData = await generateInitialsImage(profile.email)
          setProfileImage(imageData)
        } catch (error) {
          console.error("Error generating profile image:", error)
          toast({
            title: "Error",
            description: "Could not generate profile image",
            variant: "destructive",
          })
        }
      }
    }
    generateProfileImage()
  }, [profile?.email, toast])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      if (!authUser?.id) {
        throw new Error("You are not authenticated.")
      }
      const data = await getUserProfile(authUser.id)
      setProfile(data)
    } catch (err) {
      console.error("Error loading profile:", err)
      setError(err.message || "Cannot load profile.")
    } finally {
      setLoading(false)
    }
  }

  const loadAdmins = async () => {
    try {
      const adminsData = await getUsers()
      setAdmins(adminsData)
    } catch (error) {
      console.error("Error loading admins:", error)
      toast({
        title: "Error",
        description: "Could not load admins",
        variant: "destructive",
      })
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
        message: getFormattedMessage(),
      }
      await emailjs.send("service_profile", "template_profile", templateParams)
      setSubject("")
      setMessage("")
      setSelectedAdmin("")
      toast({
        title: "Success",
        description: "Message sent successfully!",
        variant: "success",
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Cannot send message",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const applyFormat = (format) => {
    setMessageFormat((prev) => ({
      ...prev,
      [format]: !prev[format],
    }))
  }

  const applyAlignment = (alignment) => {
    setMessageFormat((prev) => ({
      ...prev,
      align: alignment,
    }))
  }

  const getFormattedMessage = () => {
    let formattedText = message.replace(/\n/g, "<br />")
    formattedText = `<div style="text-align: ${messageFormat.align};">${formattedText}</div>`
    if (messageFormat.bold) {
      formattedText = `<div style="font-weight: bold;">${formattedText}</div>`
    }
    if (messageFormat.italic) {
      formattedText = `<div style="font-style: italic;">${formattedText}</div>`
    }
    if (messageFormat.isList) {
      formattedText = formattedText
        .split("<br />")
        .map((line) => (line.trim() ? `<div>• ${line}</div>` : "<br/>"))
        .join("")
    }
    return formattedText
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-8"
        >
          <Loader2 className="h-10 w-10 animate-spin text-[#B7B949] mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-300">Loading profile...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="flex items-center gap-2">
            {error}
            <Button variant="outline" size="sm" onClick={loadProfile}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-300">Profile not found.</p>
        </div>
      </div>
    )
  }

  const displayName = profile.email
    ? profile.email.split("@")[0].replace(/[^a-zA-Z]/g, "")
    : "User Profile"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Banner with gradient using #F9FAFB */}
          <div
            className="relative h-64 bg-cover bg-left"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, #F9FAFB, transparent), url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv-wlhUmDt4FKA4-tl_ccd5SXBRLBMSdV8Lg&s')",
            }}
          ></div>

          {/* Profile section below the banner */}
          <div className="flex flex-col items-center mt-4">
            {/* Profile image */}
            <div className="w-32 h-32 overflow-hidden">
              <Avatar className="w-full h-full rounded-none">
                {profileImage ? (
                  <AvatarImage
                    src={profileImage}
                    alt="User Profile"
                    className="object-contain w-full h-full rounded-none"
                    style={{ transform: "scale(0.9)" }}
                  />
                ) : (
                  <AvatarFallback className="w-full h-full flex items-center justify-center">
                    {profile?.email?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-black drop-shadow dark:text-[#B7B949]">
              {displayName}
            </h1>
            <p className="text-gray-300">{profile.email}</p>
          </div>

          {/* Additional info */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow overflow-hidden mt-8">
            <div className="px-6 py-6">
              <Separator className="my-4 border-gray-300 dark:border-gray-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col p-4 bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name</Label>
                  </div>
                  <p className="text-gray-600 dark:text-gray-200 text-sm">{displayName}</p>
                </div>
                <div className="flex flex-col p-4 bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</Label>
                  </div>
                  <p className="text-gray-600 dark:text-gray-200 text-sm">{profile.email}</p>
                </div>
                <div className="flex flex-col p-4 bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Department</Label>
                  </div>
                  <p className="text-gray-600 dark:text-gray-200 text-sm">Râmnicu Vâlcea</p>
                </div>
                <div className="flex flex-col p-4 bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</Label>
                  </div>
                  <p className="text-gray-600 dark:text-gray-200 text-sm">Romania</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <Card className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow overflow-hidden mt-8">
            <CardHeader className="bg-[#F6F6C5] dark:bg-[#2D2D2D] border-b border-[#E6E67A] dark:border-gray-600 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-[#B7B949] dark:text-[#B7B949]">
                <Mail className="h-5 w-5" />
                Contact an Admin
              </CardTitle>
              <CardDescription className="text-[#B7B949] dark:text-[#B7B949]">
                You can send a message to an admin to request user creation or assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6">
              <form onSubmit={handleContactAdmin} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300 font-semibold">Admin Area</Label>
                  <select
                    value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2D2D2D] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B7B949]"
                    required
                  >
                    <option value="">Select an Admin</option>
                    {admins.map((admin) => (
                      <option key={admin._id} value={admin.email}>
                        {admin.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300 font-semibold">Title</Label>
                  <Input
                    placeholder="Title"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2D2D2D] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B7B949]"
                    required
                  />
                </div>

                <Tabs defaultValue="edit" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-[200px] grid-cols-2">
                      <TabsTrigger value="edit" className="py-2">
                        Edit
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="py-2">
                        Preview
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyFormat("bold")}
                          className={cn(
                            "h-8 w-8 p-0",
                            messageFormat.bold && "bg-[#B7B949] text-white hover:bg-[#A5A337]"
                          )}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyFormat("italic")}
                          className={cn(
                            "h-8 w-8 p-0",
                            messageFormat.italic && "bg-[#B7B949] text-white hover:bg-[#A5A337]"
                          )}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyFormat("isList")}
                          className={cn(
                            "h-8 w-8 p-0",
                            messageFormat.isList && "bg-[#B7B949] text-white hover:bg-[#A5A337]"
                          )}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>

                      <Separator orientation="vertical" className="h-6 border-gray-300 dark:border-gray-600" />

                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyAlignment("left")}
                          className={cn(
                            "h-8 w-8 p-0",
                            messageFormat.align === "left" && "bg-[#B7B949] text-white hover:bg-[#A5A337]"
                          )}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyAlignment("center")}
                          className={cn(
                            "h-8 w-8 p-0",
                            messageFormat.align === "center" && "bg-[#B7B949] text-white hover:bg-[#A5A337]"
                          )}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyAlignment("right")}
                          className={cn(
                            "h-8 w-8 p-0",
                            messageFormat.align === "right" && "bg-[#B7B949] text-white hover:bg-[#A5A337]"
                          )}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <TabsContent value="edit" className="mt-0">
                    <div className="relative">
                      <Textarea
                        placeholder="Description"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={cn(
                          "min-h-[200px] resize-none font-mono rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2D2D2D] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#B7B949]",
                          messageFormat.bold && "font-bold",
                          messageFormat.italic && "italic",
                          `text-${messageFormat.align}`
                        )}
                        required
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                        {message.length} characters
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-0">
                    <div
                      className={cn(
                        "min-h-[200px] rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2D2D2D] px-3 py-2",
                        `text-${messageFormat.align}`
                      )}
                    >
                      <div
                        className="prose prose-sm text-gray-700 dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: getFormattedMessage(),
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  type="submit"
                  className="w-full py-3 bg-[#B7B949] text-white rounded-md hover:bg-[#A5A337] transition-colors"
                  disabled={isSubmitting || !subject.trim() || !message.trim() || !selectedAdmin}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </div>
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

function getUserDisplayName(user) {
  if (!user) return ""
  return user.name || user.username || user.email.split("@")[0]
}
