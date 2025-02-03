"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, X, Clock } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

export default function NotificationPopup({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  if (!notification) return null

  const containerVariants = {
    hidden: {
      opacity: 0,
      x: 50,
      y: -50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      x: 50,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed top-4 right-4 z-50"
      >
        <Card className="w-[400px] overflow-hidden border-l-4 border-l-primary shadow-lg bg-background/95 backdrop-blur-sm">
          <CardContent className="p-0">
            <motion.div
              className="h-1 bg-primary/20"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />

            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Bell className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{notification.title || "Nouvelle notification"}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={onClose}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{notification.message}</p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(notification.timestamp || new Date())}
                    </div>

                    <Button size="sm" variant="ghost" onClick={onClose}>
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

