import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function PrivateRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  return user ? children : <Navigate to="/login" state={{ from: location }} replace />
}

