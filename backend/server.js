// Import required libraries
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// ==================== MONGODB CONNECTION ====================

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// ==================== MONGODB SCHEMAS & MODELS ====================

// Message Model
const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const Message = mongoose.model('Message', messageSchema);

// Room Model
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Room = mongoose.model('Room', roomSchema);

// User Model
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  socketId: {
    type: String,
    required: true,
    unique: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// ==================== IN-MEMORY DATA ====================

const rooms = {};
const users = {};

// ==================== EXPRESS ROUTES ====================

app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// Get chat history for a room
app.get('/messages/:room', async (req, res) => {
  try {
    const { room } = req.params;
    const messages = await Message.find({ room })
      .sort({ timestamp: 1 })
      .limit(50);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ==================== SOCKET.IO EVENTS ====================

io.on('connection', (socket) => {
  console.log('✅ New user connected:', socket.id);

  // JOIN ROOM EVENT
  socket.on('joinRoom', async (data) => {
    const { room, username } = data;

    console.log(`👤 ${username} joined room: ${room}`);

    socket.join(room);
    users[socket.id] = { username, room };

    if (!rooms[room]) {
      rooms[room] = [];
    }
    rooms[room].push(socket.id);

    // Create room in database if not exists
    try {
      await Room.findOneAndUpdate(
        { name: room },
        { name: room },
        { upsert: true, new: true }
      );
    } catch (err) {
      // Ignore duplicate key error
    }

    // Save user to database
    try {
      await User.create({
        username,
        room,
        socketId: socket.id
      });
    } catch (err) {
      console.error('Error saving user:', err.message);
    }

    // Load chat history
    try {
      const history = await Message.find({ room })
        .sort({ timestamp: 1 })
        .limit(50);

      socket.emit('loadHistory', history);
    } catch (err) {
      console.error('Error loading history:', err);
    }

    const usersInRoom = rooms[room]
      .map(id => users[id]?.username)
      .filter(Boolean);

    io.to(room).emit('onlineUsers', {
      count: rooms[room].length,
      usernames: usersInRoom
    });

    io.to(room).emit('systemMessage', {
      message: `${username} joined the room`,
      timestamp: new Date()
    });
  });

  // CHAT MESSAGE EVENT
  socket.on('chatMessage', async (data) => {
    const { message, room, username } = data;

    if (!message.trim()) return;

    try {
      const newMessage = await Message.create({
        room,
        username,
        message,
        timestamp: new Date()
      });

      io.to(room).emit('chatMessage', {
        username,
        message,
        timestamp: newMessage.timestamp,
        socketId: socket.id
      });

      io.to(room).emit('stopTyping');
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // TYPING EVENT
  socket.on('typing', (data) => {
    const { room, username } = data;
    socket.to(room).emit('typing', { username });
  });

  // STOP TYPING EVENT
  socket.on('stopTyping', (data) => {
    const { room } = data;
    io.to(room).emit('stopTyping');
  });

  // DISCONNECT EVENT
  socket.on('disconnect', async () => {
    const user = users[socket.id];

    if (user) {
      const { username, room } = user;

      console.log(`❌ ${username} disconnected from ${room}`);

      try {
        await User.deleteOne({ socketId: socket.id });
      } catch (err) {
        console.error('Error removing user:', err);
      }

      if (rooms[room]) {
        rooms[room] = rooms[room].filter(id => id !== socket.id);

        if (rooms[room].length === 0) {
          delete rooms[room];
          console.log(`🗑️ Room "${room}" deleted`);
        } else {
          const usersInRoom = rooms[room]
            .map(id => users[id]?.username)
            .filter(Boolean);

          io.to(room).emit('onlineUsers', {
            count: rooms[room].length,
            usernames: usersInRoom
          });

          io.to(room).emit('systemMessage', {
            message: `${username} left the room`,
            timestamp: new Date()
          });
        }
      }

      delete users[socket.id];
    }
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
