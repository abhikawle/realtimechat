import React, { useState, useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import OnlineUsersList from './OnlineUsersList';
import TypingIndicator from './TypingIndicator';
import RoomHistory from './RoomHistory';

const ChatRoom = ({ socket, room, username, onLeaveRoom, onChangeRoom }) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up Socket.io event listeners
  useEffect(() => {
    if (!socket) return;

    // Clear messages when room changes (will be repopulated by loadHistory)
    setMessages([]);
    setOnlineUsers([]);
    setIsTyping(false);

    // Load chat history when joining room
    socket.on('loadHistory', (history) => {
      const formattedMessages = history.map(msg => ({
        id: msg._id,
        username: msg.username,
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        isSystem: false
      }));
      setMessages(formattedMessages);
    });

    // Receive new messages
    socket.on('chatMessage', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: data.username,
        message: data.message,
        timestamp: new Date(data.timestamp),
        isSystem: false
      }]);
    });

    // System messages (user joined/left)
    socket.on('systemMessage', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: data.message,
        timestamp: new Date(data.timestamp),
        isSystem: true
      }]);
    });

    // Update online users list
    socket.on('onlineUsers', (data) => {
      setOnlineUsers(data.usernames || []);
    });

    // Show typing indicator
    socket.on('typing', (data) => {
      setTypingUser(data.username);
      setIsTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    });

    // Hide typing indicator
    socket.on('stopTyping', () => {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    });

    return () => {
      socket.off('loadHistory');
      socket.off('chatMessage');
      socket.off('systemMessage');
      socket.off('onlineUsers');
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, [socket, room]);

  const handleSendMessage = (message) => {
    if (socket && message.trim()) {
      socket.emit('chatMessage', { message, room, username });
      socket.emit('stopTyping', { room });
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { room, username });
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEditMessage = (messageId, messageText) => {
    setEditingId(messageId);
    setEditText(messageText);
  };

  const handleSaveEdit = (messageId) => {
    if (editText.trim()) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, message: editText, edited: true } : msg
      ));
      // Edit only saved locally for now (backend support can be added later)
      setEditingId(null);
      setEditText('');
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Delete this message?')) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      // Delete only locally for now (backend support can be added later)
    }
  };

  const handleChangeRoom = (newRoom) => {
    onChangeRoom(newRoom);
  };

  return (
    <div className="chat-room">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <h2>📁 {room}</h2>
          <button onClick={onLeaveRoom} className="leave-btn">Leave Room</button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="chat-container">
        {/* Online Users Sidebar (Left) */}
        <OnlineUsersList users={onlineUsers} currentUser={username} />

        {/* Messages Section (Center) */}
        <div className="messages-section">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>👋 Welcome to {room}!</p>
                <p>Start the conversation...</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.username === username;
                return (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.isSystem ? 'system-message' : ''} ${isCurrentUser && !msg.isSystem ? 'current-user-message' : 'other-user-message'}`}
                  >
                    {!msg.isSystem && (
                      <div className="message-header">
                        <span className="username">👤 {msg.username}</span>
                        <span className="timestamp">{formatTime(msg.timestamp)}</span>
                        {isCurrentUser && !msg.isSystem && (
                          <div className="message-actions">
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => handleEditMessage(msg.id, msg.message)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {editingId === msg.id ? (
                      <div className="message-edit-form">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="edit-input"
                        />
                        <div className="edit-actions">
                          <button 
                            className="edit-save"
                            onClick={() => handleSaveEdit(msg.id)}
                          >
                            Save
                          </button>
                          <button 
                            className="edit-cancel"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`message-text ${msg.isSystem ? 'system-text' : ''}`}>
                        {msg.isSystem ? `ℹ️ ${msg.message}` : msg.message}
                        {msg.edited && <span className="edited-tag">(edited)</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {isTyping && <TypingIndicator username={typingUser} />}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
        </div>

        {/* Room History Sidebar (Right) */}
        <RoomHistory currentRoom={room} onSelectRoom={handleChangeRoom} />
      </div>
    </div>
  );
};

export default ChatRoom;
