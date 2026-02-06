import React, { useState } from 'react';

const RoomSelection = ({ onJoinRoom, savedUsername = '' }) => {
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState(savedUsername);

  const handleJoin = () => {
    if (roomName.trim() && username.trim()) {
      onJoinRoom(roomName.trim(), username.trim());
      setRoomName('');
      setUsername('');
    } else {
      alert('Please enter both username and room name');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="room-selection">
      <div className="room-selection-container">
        <h1>💬 Real-Time Chat</h1>
        <p>Join a chat room to start messaging</p>
        
        <div className="input-group">
          <label>Username: {savedUsername && <span style={{fontSize: '12px', color: '#2a5298'}}>✓ Saved</span>}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            onKeyPress={handleKeyPress}
            autoFocus={!savedUsername}
          />
        </div>

        <div className="input-group">
          <label>Room Name:</label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name (e.g., General, Gaming)"
            onKeyPress={handleKeyPress}
          />
        </div>

        <button onClick={handleJoin} className="join-btn">
          Join Room
        </button>

        <div className="info">
          <p>💡 Tip: Enter the same room name as others to join their chat</p>
        </div>
      </div>
    </div>
  );
};

export default RoomSelection;
