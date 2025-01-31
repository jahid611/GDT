import { useState, useEffect, useRef } from "react"
import { useSocket } from "../../contexts/SocketContext"
import { useAuth } from "../../contexts/AuthContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { addMessage, getMessages } from "../../utils/api"

export function ChatMessages({ selectedUser, selectedUserData }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { socket, emit } = useSocket()
  const { user } = useAuth()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser) return

      try {
        setIsLoading(true)
        setError("")
        const data = await getMessages(selectedUser)
        setMessages(Array.isArray(data) ? data : [])
        scrollToBottom()
      } catch (err) {
        console.error("Error loading messages:", err)
        setError(err.message || "Erreur lors du chargement des messages")
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [selectedUser, scrollToBottom]) // Added scrollToBottom to dependencies

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = ({ message }) => {
      if (
        (message.senderId === user.id && message.recipientId === selectedUser) ||
        (message.senderId === selectedUser && message.recipientId === user.id)
      ) {
        setMessages((prev) => [...prev, message])
        scrollToBottom()
      }
    }

    socket.on("new_message", handleNewMessage)
    return () => socket.off("new_message", handleNewMessage)
  }, [socket, user.id, selectedUser, scrollToBottom]) // Added scrollToBottom to dependencies

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSubmitting(true)
    setError("")

    try {
      const messageData = {
        content: newMessage,
        recipientId: selectedUser,
      }

      const savedMessage = await addMessage(selectedUser, messageData)
      emit("new_message", { message: savedMessage })
      setMessages((prev) => [...prev, savedMessage])
      setNewMessage("")
      scrollToBottom()
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi du message")
      console.error("Message error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 px-4">
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-4">
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <div
              key={message._id || index}
              className={`flex ${message.senderId === user.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.senderId === user.id ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {message.senderId === user.id ? "Vous" : selectedUserData?.email?.split("@")[0]}
                  </span>
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp || message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm break-words">{message.content}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun message pour le moment</p>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1"
          disabled={isSubmitting}
        />
        <Button type="submit" size="icon" disabled={isSubmitting || !newMessage.trim()}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}

