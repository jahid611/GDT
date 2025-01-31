import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { useSocket } from "../../contexts/SocketContext"
import { ChatDialog } from "./chat-dialog"

export function ChatButton() {
  const { isConnected, onlineUsers } = useSocket()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          {onlineUsers.size > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-green-500 text-xs flex items-center justify-center">
              {onlineUsers.size}
            </span>
          )}
        </div>
      </Button>
      <ChatDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}

