import { useState, useEffect, useRef } from "react"
import { useChat } from "../../hooks/useChat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send } from "lucide-react"

export function ChatRoom({ roomId, userId }) {
  const { connected, messages, onlineUsers, typingUsers, error, sendMessage, handleTyping } = useChat(
    "http://localhost:5000",
    userId,
  )

  const [inputValue, setInputValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollRef = useRef(null)

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [scrollRef]) // Corrected dependency

  // Gestion de la frappe
  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    handleTyping(roomId, e.target.value.length > 0)
  }

  // Envoi du message
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || !connected) return

    setIsSubmitting(true)
    try {
      await sendMessage(roomId, inputValue.trim())
      setInputValue("")
      handleTyping(roomId, false)
    } catch (err) {
      console.error("Error sending message:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Affichage des utilisateurs en train d'écrire
  const renderTypingIndicator = () => {
    const typingInRoom = Array.from(typingUsers.values())
      .filter(({ roomId: typingRoomId }) => typingRoomId === roomId)
      .map(({ userId }) => onlineUsers.find((user) => user.id === userId)?.name || "Someone")

    if (typingInRoom.length === 0) return null

    return (
      <div className="text-sm text-muted-foreground italic">
        {typingInRoom.join(", ")} {typingInRoom.length === 1 ? "is" : "are"} typing...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.userId === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.userId === userId ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`/placeholder.svg?text=${message.userId.slice(0, 2)}`} />
                  <AvatarFallback>{message.userId.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.userId === userId ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-sm font-medium">{message.userId === userId ? "You" : message.userId}</span>
                    <span className="text-xs opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm break-words">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          {renderTypingIndicator()}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border flex gap-2">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={!connected || isSubmitting}
          className="flex-1"
        />
        <Button type="submit" disabled={!connected || isSubmitting || !inputValue.trim()}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}

