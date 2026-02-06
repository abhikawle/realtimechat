import React from 'react';

const OnlineUsersList = ({ users, currentUser }) => {
  return (
    <div className="online-users">
      <h3>👥 Online ({users.length})</h3>
      <ul>
        {users && users.length > 0 ? (
          users.map((user, index) => (
            <li key={index} className={user === currentUser ? 'current-user' : ''}>
              <span className="user-dot">●</span>
              <span className="user-name">{user}</span>
              {user === currentUser && <span className="you">(You)</span>}
            </li>
          ))
        ) : (
          <li className="no-users">No users online</li>
        )}
      </ul>
    </div>
  );
};

export default OnlineUsersList;
