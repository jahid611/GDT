import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

export function SocketTest() {
  const { isConnected, onlineUsers } = useSocket();
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg rounded-lg border z-50">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-medium">
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
      </div>
    </div>
  );
}