import React, { useState, useEffect } from "react"
import { createTask, getUsers } from "../utils/api"
import { useNotifications } from "../contexts/NotificationContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function TaskCreationForm({ onSuccess, onCancel, onTaskCreated }) {
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

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      setUserError("")
      const fetchedUsers = await getUsers()
      console.log("Fetched users:", fetchedUsers)
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
      const newTask = await createTask(formData)
      showToast("Succès", "Tâche créée avec succès")
      onTaskCreated?.(newTask)
      onSuccess?.()
    } catch (err) {
      console.error("Error creating task:", err)
      showToast("Erreur", err.message, "destructive")
    } finally {
      setLoading(false)
    }
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
                {user.name} ({user.email})
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading || loadingUsers}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            "Créer la tâche"
          )}
        </Button>
      </div>
    </form>
  )
}

