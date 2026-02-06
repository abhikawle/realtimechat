import React, { useState } from 'react';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Allow Shift+Enter for new line
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    onTyping(); // Notify others that user is typing
  };

  return (
    <div className="message-input-container">
      <div className="input-wrapper">
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
          rows="1"
        />
      </div>
      <button 
        onClick={handleSend} 
        className="send-btn"
        disabled={!message.trim()}
        title="Send message (Enter)"
      >
        ✈️
      </button>
    </div>
  );
};

export default MessageInput;
