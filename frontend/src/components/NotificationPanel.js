import React from 'react'
import { useNotifications } from '../contexts/NotificationContext'
import { Bell, Check, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function NotificationPanel() {
  const { notifications, markAsRead } = useNotifications()

  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <Bell className="h-8 w-8 mb-2" />
        <p>Aucune notification</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`
              flex items-start gap-4 p-4 rounded-lg border
              ${notification.read ? 'bg-muted' : 'bg-card'}
            `}
          >
            <div className={`
              rounded-full p-2
              ${notification.read ? 'bg-muted-foreground/10' : 'bg-primary/10'}
            `}>
              {notification.read ? (
                <Check className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Bell className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none">
                {notification.message}
              </p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {format(new Date(notification.createdAt), 'Pp', { locale: fr })}
              </p>
            </div>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsRead(notification._id)}
              >
                Marquer comme lu
              </Button>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}