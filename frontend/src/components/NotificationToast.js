import React from 'react'
import { useNotifications } from '../contexts/NotificationContext'
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'

export default function NotificationToast() {
  const { toast } = useToast()
  let showToast = useNotifications().showToast; //Fixed: use let instead of const and directly access showToast from useNotifications

  // Mise à jour de la fonction showToast dans le contexte
  React.useEffect(() => {
    showToast = (title, message, variant = 'default') => {
      toast({
        title,
        description: message,
        variant,
      })
    }
  }, [toast, showToast]) //Fixed: Added showToast to dependencies

  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}