import { useState } from "react"
import { ChatRoom } from "./ChatRoom"
import { ChatRoomList } from "./ChatRoomList"
import { useChat } from "../../hooks/useChat"

export function ChatApp({ userId }) {
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const { rooms, connected, error } = useChat("http://localhost:5000", userId)

  const handleCreateRoom = (roomName) => {
    // Logique de création de salle
    console.log("Creating room:", roomName)
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      <div className="w-64 border-r bg-card">
        <ChatRoomList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onRoomSelect={setSelectedRoomId}
          onCreateRoom={handleCreateRoom}
        />
      </div>
      <div className="flex-1 bg-background">
        {selectedRoomId ? (
          <ChatRoom roomId={selectedRoomId} userId={userId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a room to start chatting
          </div>
        )}
      </div>
    </div>
  )
}

