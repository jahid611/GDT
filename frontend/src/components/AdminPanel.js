'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { UserPlus, Loader2 } from 'lucide-react'

export default function AdminPanel() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  })
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Envoi des données:', formData)

      const response = await fetch('http://localhost:5000/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      console.log('Réponse du serveur:', response.status, data)

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du compte administrateur')
      }

      toast({
        title: "Succès",
        description: "Le compte administrateur a été créé avec succès.",
      })

      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'admin'
      })
    } catch (error) {
      console.error('Erreur lors de la création:', error.message)

      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Création de compte administrateur</CardTitle>
          <CardDescription>
            Créez un nouveau compte avec des privilèges administrateur.
            Attention : cette action ne peut pas être annulée.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                aria-required="true"
                aria-describedby="username-help"
              />
              <p id="username-help" className="text-sm text-muted">Au moins 3 caractères.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                aria-required="true"
                aria-describedby="password-help"
              />
              <p id="password-help" className="text-sm text-muted">Au moins 6 caractères.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
              aria-live="polite"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer un compte administrateur
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
