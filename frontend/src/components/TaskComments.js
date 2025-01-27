import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addComment } from "../utils/api"

export default function TaskComments({ taskId, comments = [], onCommentAdded }) {
  const [newComment, setNewComment] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    setError("")

    try {
      const updatedTask = await addComment(taskId, newComment)
      setNewComment("")
      onCommentAdded(updatedTask)
    } catch (err) {
      setError(err.message || "Erreur lors de l'ajout du commentaire")
      console.error("Comment error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Commentaires</h3>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
        {comments.map((comment, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{comment.user?.name || "Utilisateur"}</span>
              <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString("fr-FR")}</span>
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">Aucun commentaire pour le moment</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </form>
    </div>
  )
}

