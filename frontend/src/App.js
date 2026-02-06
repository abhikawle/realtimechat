import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import ChatRoom from './components/ChatRoom';
import RoomSelection from './components/RoomSelection';
import './App.css';

const SOCKET_SERVER = 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [username, setUsername] = useState(() => {
    // Load username from localStorage if available
    return localStorage.getItem('username') || '';
  });

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle joining a room
  const handleJoinRoom = (roomName, user) => {
    if (socket && roomName.trim() && user.trim()) {
      setUsername(user);
      // Save username to localStorage
      localStorage.setItem('username', user);
      setCurrentRoom(roomName);
      
      // Emit joinRoom event to backend
      socket.emit('joinRoom', { room: roomName, username: user });
    }
  };

  // Handle leaving a room
  const handleLeaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('stopTyping', { room: currentRoom });
    }
    setCurrentRoom(null);
  };

  // Handle changing room from history
  const handleChangeRoom = (newRoom) => {
    if (socket) {
      if (currentRoom) {
        socket.emit('stopTyping', { room: currentRoom });
      }
      setCurrentRoom(newRoom);
      socket.emit('joinRoom', { room: newRoom, username });
    }
  };

  return (
    <div className="app">
      {!currentRoom ? (
        <RoomSelection onJoinRoom={handleJoinRoom} savedUsername={username} />
      ) : (
        <ChatRoom
          socket={socket}
          room={currentRoom}
          username={username}
          onLeaveRoom={handleLeaveRoom}
          onChangeRoom={handleChangeRoom}
        />
      )}
    </div>
  );
}

export default App;
