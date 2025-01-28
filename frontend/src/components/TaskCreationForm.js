import React, { useState, useEffect } from "react"
import { createTask, updateTask, getUsers, createNotification } from "../utils/api"
import { useNotifications } from "../contexts/NotificationContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function TaskCreationForm({ onSuccess, onCancel, mode = "create", initialData = null }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    deadline: "",
    estimatedTime: "",
    assignedTo: "",
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userError, setUserError] = useState("")
  const { showToast } = useNotifications()
  const { user } = useAuth()

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        status: initialData.status || "todo",
        priority: initialData.priority || "medium",
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : "",
        estimatedTime: initialData.estimatedTime || "",
        assignedTo: initialData.assignedTo?._id || "",
      })
    }
  }, [initialData])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      setUserError("")
      const fetchedUsers = await getUsers()
      setUsers(fetchedUsers)
    } catch (err) {
      console.error("Error loading users:", err)
      setUserError(err.message)
      showToast("Erreur", err.message, "destructive")
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loadingUsers) return

    try {
      setLoading(true)
      let result

      // Créer ou modifier la tâche
      if (mode === "edit" && initialData?._id) {
        result = await updateTask(initialData._id, formData)
      } else {
        result = await createTask({
          ...formData,
          createdBy: user.id
        })
      }

      // Si une tâche est assignée, créer une notification
      if (formData.assignedTo) {
        const assignedUser = users.find(u => u._id === formData.assignedTo)
        if (assignedUser) {
          try {
            await createNotification({
              userId: assignedUser._id,
              type: 'TASK_ASSIGNED',
              message: `${user.name} vous a assigné la tâche "${formData.title}"`,
              taskId: result._id,
              read: false
            })
          } catch (error) {
            console.error('Erreur lors de la création de la notification:', error)
          }
        }
      }

      showToast(
        "Succès", 
        mode === "edit" ? "Tâche modifiée avec succès" : "Tâche créée avec succès"
      )
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      console.error("Error handling task:", err)
      showToast(
        "Erreur", 
        err.message || `Impossible de ${mode === "edit" ? "modifier" : "créer"} la tâche`, 
        "destructive"
      )
    } finally {
      setLoading(false)
    }
  }

  // Fonction utilitaire pour obtenir le nom d'affichage de l'utilisateur
  const getUserDisplayName = (user) => {
    // Utilise username s'il existe, sinon utilise name, sinon utilise email
    return user.username || user.name || user.email
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priorité</Label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="review">En révision</option>
            <option value="done">Terminé</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date limite</Label>
          <Input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedTime">Temps estimé (heures)</Label>
          <Input
            id="estimatedTime"
            type="number"
            min="0"
            step="0.5"
            value={formData.estimatedTime}
            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Assigné à</Label>
        <div className="relative">
          <select
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loadingUsers}
          >
            <option value="">Non assigné</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {getUserDisplayName(user)}
              </option>
            ))}
          </select>
          {loadingUsers && (
            <div className="absolute right-3 top-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {userError && (
          <p className="text-sm text-destructive mt-1">
            {userError}
            <button type="button" onClick={loadUsers} className="ml-2 underline hover:no-underline">
              Réessayer
            </button>
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading || loadingUsers}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "edit" ? "Modification..." : "Création..."}
            </>
          ) : (
            mode === "edit" ? "Modifier la tâche" : "Créer la tâche"
          )}
        </Button>
      </div>
    </form>
  )
}