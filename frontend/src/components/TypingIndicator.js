import React from 'react';

const TypingIndicator = ({ username }) => {
  return (
    <div className="typing-indicator">
      <span className="typing-user">{username}</span> is typing
      <span className="dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  );
};

export default TypingIndicator;
