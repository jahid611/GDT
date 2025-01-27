import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { NotificationProvider } from "./contexts/NotificationContext"
import Dashboard from "./components/Dashboard"
import Login from "./components/Login"
import UserProfile from "./components/UserProfile"
import UserManagement from "./components/UserManagement"
import RegisterForm from "./components/RegisterForm"
import PrivateRoute from "./components/PrivateRoute"
import NotificationToast from "./components/NotificationToast"

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
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
          </Routes>
          <NotificationToast />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App