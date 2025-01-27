import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

export default function NotificationPopup({ notification, onClose, onView }) {
  useEffect(() => {
    // Ferme automatiquement après 5 secondes
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!notification) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-96 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Nouvelle tâche assignée</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onClose}
                  >
                    Plus tard
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      onView(notification)
                      onClose()
                    }}
                  >
                    Voir la tâche
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}