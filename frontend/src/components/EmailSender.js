"use client"

import { useState, useEffect } from "react"
import emailjs from "@emailjs/browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

const EmailSender = ({ initialData }) => {
  const [to, setTo] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [status, setStatus] = useState("todo")
  const [deadline, setDeadline] = useState("")
  const [responseMessage, setResponseMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (initialData) {
      setTo(initialData.to_email || "")
      setTitle(initialData.task_title || "")
      setDescription(initialData.task_description || "")
      setPriority(initialData.task_priority || "medium")
      setStatus(initialData.task_status || "todo")

      // Convertir la date en format local pour l'input datetime-local
      if (initialData.task_deadline) {
        // Supprimer le '.000Z' s'il existe
        const cleanDate = initialData.task_deadline.replace(".000Z", "")
        setDeadline(cleanDate)
      }
    }
  }, [initialData])

  const formatDate = (dateStr) => {
    try {
      // Supprimer le '.000Z' s'il existe
      const cleanDate = dateStr.replace(".000Z", "")
      const date = new Date(cleanDate)

      if (isNaN(date.getTime())) {
        console.error("Date invalide:", dateStr)
        return ""
      }

      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")

      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error)
      return ""
    }
  }

  const sendEmail = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setResponseMessage("Envoi en cours...")
    setIsSuccess(false)
    setIsError(false)

    const formattedDeadline = deadline ? formatDate(deadline) : ""
    console.log("Date originale:", deadline)
    console.log("Date formatée:", formattedDeadline)

    const templateParams = {
      to_email: to,
      task_title: title,
      task_description: description,
      task_priority: priority,
      task_status: status,
      task_deadline: formattedDeadline,
    }

    try {
      await emailjs.send("service_jhd", "template_jhd", templateParams, "FiWAOQdkaG34q5-hc")
      setResponseMessage("E-mail envoyé avec succès !")
      setIsSuccess(true)
      // Réinitialiser le formulaire
      setTo("")
      setTitle("")
      setDescription("")
      setPriority("medium")
      setStatus("todo")
      setDeadline("")
    } catch (error) {
      setResponseMessage("Erreur lors de l'envoi de l'e-mail : " + error.text)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const priorityOptions = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
  }

  const statusOptions = {
    todo: "À faire",
    in_progress: "En cours",
    done: "Terminé",
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Nouvelle tâche</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={sendEmail} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="Adresse e-mail"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Titre</label>
            <Input type="text" placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date limite</label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Envoi en cours..." : "Envoyer"}
          </Button>
        </form>

        {responseMessage && (
          <Alert variant={isSuccess ? "default" : "destructive"} className="mt-4">
            {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{responseMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default EmailSender

