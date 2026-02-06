# Real-Time Chat Backend

Node.js + Express + Socket.io backend for real-time chat application

## Installation

```bash
npm install
```

## Running the server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Environment Variables

Create a `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/realtime-chat
PORT=5000
CLIENT_URL=http://localhost:3000
```

## Features

- Real-time messaging with Socket.io
- Chat room support
- Chat history stored in MongoDB
- Online users display
- Typing indicator
