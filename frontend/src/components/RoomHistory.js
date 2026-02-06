import React, { useState, useEffect } from 'react';

const RoomHistory = ({ currentRoom, onSelectRoom }) => {
  const [previousRooms, setPreviousRooms] = useState([]);

  // Load room history from localStorage
  useEffect(() => {
    const savedRooms = JSON.parse(localStorage.getItem('chatRooms')) || [];
    // Filter out current room and duplicates
    const filteredRooms = [...new Set(savedRooms)].filter(room => room !== currentRoom);
    setPreviousRooms(filteredRooms.slice(0, 10)); // Keep last 10 rooms
  }, [currentRoom]);

  // Save room to history
  const saveRoomToHistory = (room) => {
    const savedRooms = JSON.parse(localStorage.getItem('chatRooms')) || [];
    const updatedRooms = [room, ...savedRooms.filter(r => r !== room)];
    localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
  };

  // Add current room when changed
  useEffect(() => {
    saveRoomToHistory(currentRoom);
  }, [currentRoom]);

  const handleSelectRoom = (room) => {
    if (room !== currentRoom) {
      onSelectRoom(room);
    }
  };

  return (
    <div className="room-history">
      <div className="room-history-header">
        <h3>📚 Previous Rooms</h3>
      </div>
      
      <div className="room-history-list">
        {previousRooms.length === 0 ? (
          <div className="no-history">
            <p>No previous rooms</p>
          </div>
        ) : (
          previousRooms.map((room) => (
            <button
              key={room}
              className="room-history-item"
              onClick={() => handleSelectRoom(room)}
              title={room}
            >
              <span className="room-icon">💬</span>
              <span className="room-name">{room}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomHistory;
