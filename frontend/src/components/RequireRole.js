import { useAuth } from "../contexts/AuthContext"
import { Navigate } from "react-router-dom"
import { useNotifications } from "../contexts/NotificationContext"
import { useTranslation } from "../hooks/useTranslation"

export default function RequireRole({ children, role }) {
  const { user, hasRole } = useAuth()
  const { showToast } = useNotifications()
  const { t } = useTranslation()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasRole(role)) {
    showToast(t("error"), t("unauthorizedAccess"), "destructive")
    return <Navigate to="/" replace />
  }

  return children
}

