import React from "react"
import { Toast, ToastDescription, ToastTitle, ToastProvider, ToastViewport } from "@/components/ui/toast"
import { useNotifications } from "../contexts/NotificationContext"

export default function NotificationToast() {
  const { currentToast, hideToast } = useNotifications()

  if (!currentToast) return null

  return (
    <ToastProvider>
      <Toast onOpenChange={hideToast}>
        <ToastTitle>{currentToast.title}</ToastTitle>
        <ToastDescription>{currentToast.message}</ToastDescription>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  )
}

