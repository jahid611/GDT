import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Hash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function ChatRoomList({ rooms, onRoomSelect, onCreateRoom, selectedRoomId }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")

  const handleCreateRoom = (e) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    onCreateRoom(newRoomName.trim())
    setNewRoomName("")
    setIsDialogOpen(false)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Rooms</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <Input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                autoFocus
              />
              <Button type="submit" disabled={!newRoomName.trim()}>
                Create Room
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={selectedRoomId === room.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onRoomSelect(room.id)}
            >
              <Hash className="h-4 w-4 mr-2" />
              {room.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

