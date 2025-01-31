import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { useSocket } from "../../contexts/SocketContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { OnlineUsers } from "./OnlineUsers"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessages } from "./ChatMessages"
import { getUsers } from "../../utils/api"
import { Loader2 } from "lucide-react"

export function ChatButton() {
  const { isConnected, onlineUsers } = useSocket()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Load users when dialog opens
  const handleOpenChange = async (open) => {
    console.log("Dialog open state changing to:", open)
    setIsOpen(open)
    if (open) {
      try {
        setLoading(true)
        setError("")
        console.log("Fetching users...")
        const fetchedUsers = await getUsers()
        console.log("Users fetched:", fetchedUsers)
        setUsers(fetchedUsers)
      } catch (err) {
        console.error("Error loading users:", err)
        setError(err.message || "Erreur lors du chargement des utilisateurs")
      } finally {
        setLoading(false)
      }
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      )
    }

    return (
      <div className="flex gap-4 h-[calc(100%-2rem)]">
        <div className="w-1/3 border-r border-border">
          <ScrollArea className="h-full">
            <OnlineUsers onSelectUser={setSelectedUser} selectedUser={selectedUser} users={users} />
          </ScrollArea>
        </div>
        <div className="w-2/3">
          {selectedUser ? (
            <ChatMessages selectedUser={selectedUser} selectedUserData={users.find((u) => u._id === selectedUser)} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Sélectionnez un utilisateur pour démarrer une conversation
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={() => {
          console.log("Chat button clicked")
          handleOpenChange(true)
        }}
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

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[800px] h-[600px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogHeader>
            <DialogTitle>Messages</DialogTitle>
            <DialogDescription>Communiquez en temps réel avec les autres utilisateurs</DialogDescription>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    </>
  )
}

