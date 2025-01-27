import React from "react"
import { Link } from "react-router-dom"
import RegisterForm from "../components/RegisterForm"
import { NotificationPanel } from "../frontend/src/components/NotificationPanel"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <nav className="relative max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          Gestionnaire de Tâches Vilmar
        </Link>
        <NotificationPanel />
      </nav>
      <div className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 h-[calc(100vh-5rem)]">
        <RegisterForm />
      </div>
    </div>
  )
}

