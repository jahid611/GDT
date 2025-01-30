import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { NotificationProvider } from "./contexts/NotificationContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { LanguageProvider } from "./hooks/useTranslation"
import { Toaster } from "./components/ui/toaster"
import Dashboard from "./components/Dashboard"
import Login from "./components/Login"
import UserProfile from "./components/UserProfile"
import UserManagement from "./components/UserManagement"
import RegisterForm from "./components/RegisterForm"
import PrivateRoute from "./components/PrivateRoute"
import NotificationToast from "./components/NotificationToast"
import LanguageToggle from "./components/LanguageToggle"
import "./index.css"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="gdt-theme">
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <LanguageProvider>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <UserProfile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <PrivateRoute>
                        <UserManagement />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                <LanguageToggle />
                <NotificationToast />
                <Toaster />
              </div>
            </LanguageProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App

