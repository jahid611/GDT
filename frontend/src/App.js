import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { NotificationProvider } from "./contexts/NotificationContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { SocketProvider } from "./contexts/SocketContext"
import { LanguageProvider } from "./hooks/useTranslation"
import { Toaster } from "./components/ui/toaster"
import Dashboard from "./components/Dashboard"
import Login from "./components/Login"
import UserProfile from "./components/UserProfile"
import UserManagement from "./components/UserManagement"
import RegisterForm from "./components/RegisterForm"
import PrivateRoute from "./components/PrivateRoute"
import NotificationToast from "./components/NotificationToast"
import { ThemeToggle } from "./components/ThemeToggle"
import LanguageToggle from "./components/LanguageToggle"
import HomePage from "./pages/Home"

function AppContent() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Routes privées */}
        <Route
          path="/dashboard"
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

        {/* Redirection des routes inconnues vers l'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Ne pas afficher les toggles sur la page d'accueil */}
      <Routes>
        <Route
          path="/*"
          element={
            <div className="fixed bottom-4 right-4 flex items-center gap-2 z-50">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          }
        />
      </Routes>

      <NotificationToast />
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="gdt-theme">
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <SocketProvider>
              <LanguageProvider>
                <AppContent />
              </LanguageProvider>
            </SocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App

